'use client'
import Image from 'next/image'
import { PropsWithChildren, ReactNode } from 'react'
import { titulo } from '@/components/fonts'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ShapeDividerWaves from '@/app/(sitio)/custom/shape-divider'

interface HeaderSalaProps extends PropsWithChildren {
  className?: string
  btnLogout?: ReactNode
  waveHeight?: string
}

export default function HeaderSala({ className, children, btnLogout, waveHeight }: HeaderSalaProps) {
  return (
    <div>
      <div className={cn('bg-white w-screen px-2 md:px-4 py-6 items-center grid grid-cols-3', className)}>
        <div className="flex md:w-[20em] items-start sm:items-center gap-1 md:gap-4">
          <Link href="/" className="flex items-center gap-4">
            <Image
              className="w-8 sm:ml-4 md:ml-0 md:w-16 h-auto"
              src="/img/logo_sketchy.gif"
              alt={''}
              width={2373}
              height={2217}
            />
            <div className="hidden md:flex sm:flex-col font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
              <Image
                unoptimized
                className="w-[150px] md:w-[800px] h-auto"
                src="/img/lema_sketchy.gif"
                alt={''}
                width={12013}
                height={1082}
              />
              <p className={`${titulo.className} m-0 text-nowrap md:text-[1em]`}>Educación emergente </p>
            </div>
          </Link>
        </div>
        {children}
        <div className="flex justify-end">{btnLogout}</div>
      </div>
      <ShapeDividerWaves bottom colorText="text-white" height={waveHeight} />
    </div>
  )
}
