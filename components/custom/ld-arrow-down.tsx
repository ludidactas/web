'use client'
import { Link } from 'react-scroll'
import Image from 'next/image'

interface ArrowDownLdProps {
  to: string
}
export default function ArrowDownLd({ to }: ArrowDownLdProps) {
  return (
    <div className="w-10 lg:w-16 hover:scale-125 ">
      <Link to={to} smooth={true} duration={500}>
        <Image
          src="/img/ArrowDown.gif"
          className="md:animate-[bounce_0.8s_infinite] hover:rounded-full hover:border-2 hover:border-black "
          alt="arrowdown"
          width={200}
          height={200}
        />
      </Link>
    </div>
  )
}
