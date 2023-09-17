'use server'

import path from 'path'
import User from '../models/user.model'
import { connectToDB } from '../mongoose'
import { revalidatePath } from 'next/cache'
import Thread from '../models/thread.model'
import { type FilterQuery, type SortOrder } from 'mongoose'

interface Params {
  userId: string
  username: string
  name: string
  bio: string
  image: string
  path: string
}

export async function updateUser ({
  userId,
  username,
  name,
  bio,
  image,
  path
}: Params): Promise<void> {
  connectToDB()

  try {
    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true
      },
      { upsert: true }
    )

    if (path === '/profile/edit') {
      revalidatePath(path)
    }
  } catch (error: any) {
    console.log('=> Error creating/updating user: ', error.message)
  }
}

export async function fetchUser (userId: string) {
  try {
    connectToDB()

    return await User.findOne({ id: userId })
    // .populate('threads')
  } catch (error: any) {
    console.log('=> Error fetching user: ', error.message)
  }
}

export async function fetchUserPosts (userId: string) {
  try {
    connectToDB()

    // Find all threads authored by user with the given userId
    // TODO: Populate community

    const threads = await User.findOne({ id: userId })
      .populate({
        path: 'threads',
        model: Thread,
        populate: {
          path: 'children',
          model: Thread,
          populate: {
            path: 'author',
            model: User,
            select: 'name image id  '
          }
        }
      })

    return threads
  } catch (error: any) {
    console.log('=> Error fetching user posts: ', error.message)
  }
}

export async function fetchUsers ({
  userId,
  searchString = '',
  pageNumber = 1,
  pageSize = 20,
  sortBy = 'desc'
}: {
  userId: string
  searchString?: string
  pageNumber?: number
  pageSize?: number
  sortBy?: SortOrder
}) {
  try {
    connectToDB()

    const skipAmount = (pageNumber - 1) * pageSize

    const regex = new RegExp(searchString, 'i')

    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }
    }

    if (searchString.trim() !== '') {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } }
      ]
    }

    const sortOptions = { createdAt: sortBy }

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)

    const totalUsersCount = await User.countDocuments(query)

    const users = await usersQuery.exec()

    const isNext = totalUsersCount > skipAmount + users.length

    return { users, isNext }
  } catch (error: any) {
    console.log('=> Error fetching users: ', error.message)
  }
}

export async function getActivity (userId: string) {
  try {
    connectToDB()

    // Find all threads authored by user with the given userId
    const userThreads = await Thread.find({ author: userId })

    // Collect all the child thread ids (replies) from the "children" field
    // [
    //   { id: 1, children: [10, 11] },
    //   { id: 2, children: [20, 21, 22] },
    //   { id: 3, children: [30] }
    // ]
    // gives:
    // [10, 11, 20, 21, 22, 30]

    const childThreadIds = userThreads.reduce((acc, userThreads) => {
      return acc.concat(userThreads.children)
    }, [])

    // collect all replies for the user's threads
    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userId }
    }).populate({
      path: 'author',
      model: User,
      select: 'name image _id'
    })

    return replies
  } catch (error: any) {
    console.log('=> Error fetching activity: ', error.message)
  }
}
