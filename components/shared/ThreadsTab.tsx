import { fetchUserPosts } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'
import ThreadCard from '../cards/ThreadCard'
import { threadId } from 'worker_threads'
import { fetchCommunityPosts } from '@/lib/actions/community.actions'

interface Props {
  currentUserId: string
  accountId: string
  accountType: string
}

const ThreadsTab = async ({ currentUserId, accountId, accountType }: Props) => {
  let result: any

  if (accountType === 'Community') {
    result = await fetchCommunityPosts(accountId)
  } else {
    result = await fetchUserPosts(accountId)
  } 

  if (!result) redirect('/')

  return (
      <section>
        {result.threads.map((thread: any) => (
          <ThreadCard
            key={thread._id.toString()}
            id={thread._id.toString()}
            currentUserId={currentUserId}
            parentId={thread.parentId}
            content={thread.text}
            author={
              accountType === 'User'
                ? { name: result.name, image: result.image, id: result.id }
                : { name: thread.author.name, image: thread.author.image, id: thread.author.id }
            }
            community={thread.community} // todo: from which community?
            createdAt={thread.createdAt}
            comments={thread.children}
          />
        ))}
      </section>
  )
}
export default ThreadsTab
