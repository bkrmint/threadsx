'use client'

import { sidebarLinks } from '@/constants'
import { SignOutButton, SignedIn, useAuth } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const LeftSidebar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { userId } = useAuth()

  return (
    <section className="custom-scrollbar leftsidebar">
      <div className="flex w-full flex-1 flex-col gap-6 px-6">
        {sidebarLinks.map((link) => {
          // Figure out which link is active
          const isActive = (pathname.includes(link.route) && (link.route.length > 1) || pathname === link.route
          )

          if (link.route === '/profile') link.route = `${link.route}/${userId}`

          return (
          <Link
            href={link.route}
            key={link.label}
            className={`leftsidebar__link  flex items-center space-x-2 py-2 px-3 ${isActive && 'bg-primary-500'}`}
          >

            <Image
              src={link.imgURL}
              alt={link.label}
              width={24}
              height={24}
            />
            <p className='text-light-1 max-lg:hidden'>
              {link.label}
            </p>
          </Link>
          )
        }
        )}

      </div>

      <div className='mt-10 px-6'>
        <SignedIn>
          <SignOutButton signOutCallback={() => { router.push('/sign-in') }}>
              <div className='flex cursor-pointer gap-4 p-4'>
                  <Image
                      src='/assets/logout.svg'
                      alt='sign out'
                      width={24}
                      height={24}
                  />
                  <p className='text-light-2 max-lg:hidden'>
                    Logout
                  </p>
              </div>
          </SignOutButton>
        </SignedIn>
      </div>
    </section>
  )
}

export default LeftSidebar
