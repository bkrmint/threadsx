'use server'
import { connectToDB } from '../mongoose'
import Thread from '../models/thread.model'
import User from '../models/user.model'
import { revalidatePath } from 'next/cache'

interface Params {
  text: string
  author: string
  communityId: string | null
  path: string
}

export async function createThread ({ text, author, communityId, path
}: Params) {
  try {
    connectToDB()

    const createdThread = await Thread.create({
      text,
      author,
      community: null
    })

    // update user model to know who created it
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id }
    })

    revalidatePath(path)
  } catch (error: any) {
    console.log('=> Error creating thread: ', error.message)
  }
}

export async function fetchThread (pageNumber = 1, pageSize = 20) {
  connectToDB()

  // Calculate the number of posts to skip
  const skipAmount = pageSize * (pageNumber - 1)

  // Fetch the posts that have no parents (top-level threads)
  const threadQuery = Thread.find({ parentId: [null, undefined] })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({ path: 'author', model: User })
    .populate({
      path: 'children',
      populate: {
        path: 'author',
        model: User,
        select: '_id name parentId image'
      }
    })

  // Fetch the total number of posts
  const totalThreadsCount = Thread.countDocuments({ parentId: { $in: [null, undefined] } })

  // Execute the query
  const threads = await threadQuery.exec()

  const isNext = totalThreadsCount > skipAmount + threads.length

  return { threads, isNext }
}

export async function fetchThreadById (id: string) {
  connectToDB()

  try {
    // Todo: Populate Community
    const thread = await Thread.findById(id)
      .populate({
        path: 'author',
        model: User,
        select: '_id id name image'
      })
      .populate({
        path: 'children',
        populate: [
          {
            path: 'author',
            model: User,
            select: '_id id name parentId image'
          },
          {
            path: 'children',
            model: Thread,
            populate: {
              path: 'author',
              model: User,
              select: '_id id name parentId image'
            }
          }
        ]
      }).exec()

    return thread
  } catch (error: any) {
    console.log('=> Error fetching thread by id: ', error.message)
  }
}

export async function addCommentToThread (
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB()
  try {
    // Find the orginal thread by its id
    const orginalThread = await Thread.findById(threadId)

    if (!orginalThread) {
      throw new Error('Thread not found')
    }

    // Create a new thread for the comment
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId
    })

    // Save the new thread
    const savedCommentThread = await commentThread.save()

    // Update the orginal thread to include the new comment
    orginalThread.children.push(savedCommentThread._id)

    // save the orginal thread
    await orginalThread.save()

    revalidatePath(path)
  } catch (error: any) {
    console.log('=> Error adding comment to thread: ', error.message)
  }
}

