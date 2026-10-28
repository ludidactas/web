import Link from 'next/link'
import Image from 'next/image'
import { titulo } from '@/components/fonts'
import ShapeDividerWaves from '../custom/shape-divider'
import { Icon } from '@iconify/react/dist/iconify.js'
import lemaSketchy from '@/img/lema_sketchy.gif'
import Personajito from '@/svg/components/personajito'

export default function Footer() {
  return (
    <footer className="relative">
      <ShapeDividerWaves
        top
        colorText="text-indigo-300/50"
        classname="absolute inset-x-0 bottom-full z-10 pointer-events-none"
      />
      <div className="flex flex-col items-center text-center bg-indigo-300/50">
        <div className="text-[0.8em] lg:text-[15px] flex flex-col items-center text-center gap-4 pt-10">
          <div className="flex md:w-[48em] items-center justify-center gap-4">
            <Personajito className="w-16 md:w-24" paso={1800} amplitud={18} mancha="000000" />
            <div className="font-medium text-left text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1 dark:text-slate-50 w-[60%]">
              <Image className="w-[300px] md:w-[800px] h-auto" src={lemaSketchy} alt="Ludidactas" />
              <p className={`${titulo.className} m-0 leading-none text-nowrap md:text-[1em]`}>Educación emergente </p>
            </div>
          </div>

          <Link
            className={`${titulo.className} flex flex-col items-center my-4`}
            href="https://www.instagram.com/ludidactas/"
            target="_blank"
          >
            <div className="flex flex-col items-center">
              <Icon className='w-6 h-6 md:w-10 md:h-10' icon={'mdi:instagram'} />
              <p className="m-0 text-xl md:text-2xl">@ludidactas</p>
            </div>
          </Link>

          <div className={`${titulo.className} m-5`}>
            <p className="m-0">Córdoba, Argentina</p>
            <p className="m-0">2025</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
