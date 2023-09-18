'use client'

import type * as z from 'zod' // What is type * as z?
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname, useRouter } from 'next/navigation'

import { CommentValidation } from '@/lib/validations/thread'
import Image from 'next/image'
import { addCommentToThread } from '@/lib/actions/thread.actions'

interface Props {
  threadId: string
  currentUserImg: string
  currentUserId: string
}

const Comment = ({ threadId, currentUserImg, currentUserId }: Props) => {
  const pathname = usePathname()
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(CommentValidation),
    defaultValues: {
      thread: ''
    }
  })

  const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
    await addCommentToThread(threadId, values.thread, JSON.parse(currentUserId), pathname)

    form.reset()
  }

  return (
    <Form {...form}>
      <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="comment-form"
      >
      <FormField
        control={form.control}
        name="thread"
        render={({ field }) => (
          <FormItem className='flex w-full items-center gap-3'>
            <FormLabel>
              <Image
                src={currentUserImg}
                alt="Profile Image"
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            </FormLabel>
            <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1'>
              <Input
                  type='text'
                  placeholder="Comment..."
                  className="no-focus text-light-1 outline-none"
                  {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="submit" className="comment-form-btn">
          Reply
      </Button>

      </form>
    </Form>
  )
}

export default Comment
