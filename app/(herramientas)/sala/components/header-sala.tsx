import Image from 'next/image'
import { PropsWithChildren } from 'react'
import { titulo } from '@/components/fonts'

interface HeaderProps extends PropsWithChildren {
    className?: string,
  }

export default function HeaderSala({ className, children }: HeaderProps) {
  return (
    <div className={`${className} bg-white md:m-4 w-screen px-2 md:px-4 py-6 items-center`}>
      <div className="flex md:w-[20em] items-center md:gap-4">
        <Image className="w-12 ml-4 md:ml-0 md:w-16" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
        <div className="hidden md:flex md:flex-col font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
          <Image
            className="w-[200px] md:w-[800px]"
            src="/img/lema_sketchy.gif"
            alt={''}
            width={200}
            height={200}
          />
          <p className={`${titulo.className} m-0 text-nowrap md:text-[1em]`}>Educación emergente </p>
        </div>
      </div>
      {children}
    </div>
  )
}