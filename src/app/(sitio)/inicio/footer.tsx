import Link from 'next/link'
import Image from 'next/image'
import { titulo } from '@/components/fonts'
import ShapeDividerWaves from '../custom/shape-divider'
import { Icon } from '@iconify/react/dist/iconify.js'
import logoSketchy from '@/img/logo_sketchy.gif'
import lemaSketchy from '@/img/lema_sketchy.gif'

export default function Footer() {
  return (
    <>
      <ShapeDividerWaves top colorText="text-indigo-300/50" />
      <div className="flex flex-col items-center text-center bg-indigo-300/50">
        <div className="text-[0.8em] lg:text-[15px] flex flex-col items-center text-center gap-4 pt-10">
          <div className="flex flex-col items-center gap-2">
            <Image className="w-[50px] lg:w-[100px] h-auto" src={logoSketchy} alt="" />
            <Image className="w-[200px] lg:w-[300px] h-auto" src={lemaSketchy} alt="Ludidactas" />
            <p className={`font-medium pt-1 ${titulo.className} text-[1em] m-0`}>Educación emergente </p>
          </div>

          <Link
            className={`${titulo.className} flex flex-col items-center my-4`}
            href="https://www.instagram.com/ludidactas/"
            target="_blank"
          >
            <div className="flex flex-col items-center">
              <Icon className='w-6 h-6 md:w-10 md:h-10' icon={'mdi:instagram'}/>
              <p className="m-0 text-xl md:text-2xl">@ludidactas</p>
            </div>
          </Link>

          <div className={`${titulo.className} m-5`}>
            <p className="m-0">Córdoba, Argentina</p>
            <p className="m-0">2025</p>
          </div>
        </div>
      </div>
    </>
  )
}
