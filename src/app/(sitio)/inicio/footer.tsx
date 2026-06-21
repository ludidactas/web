import Link from 'next/link'
import { Instagram } from 'lucide-react'
import Image from 'next/image'
import { titulo } from '@/components/fonts'
import ShapeDividerWaves from '../custom/shape-divider'

export default function Footer() {
  return (
    <>
      <ShapeDividerWaves top colorText="text-indigo-300/50" />
      <div className="flex flex-col items-center text-center bg-indigo-300/50">
        <div className="text-[0.8em] lg:text-[15px] flex flex-col items-center text-center gap-4 pt-10">
          <div className="flex flex-col items-center gap-2">
            <Image className="w-[50px] lg:w-[100px]" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
            <Image className="w-[200px] lg:w-[300px]" src="/img/lema_sketchy.gif" alt={''} width={300} height={300} />
            <p className={`font-medium pt-1 ${titulo.className} text-[1em] m-0`}>Educación emergente </p>
          </div>

          <Link
            className={`${titulo.className} flex flex-col items-center my-4`}
            href="https://www.instagram.com/ludidactas/"
            target="_blank"
          >
            <div className="hidden lg:flex flex-col items-center">
              <Instagram width={35} height={35} /> <p className="m-0 text-2xl">@ludidactas</p>{' '}
            </div>
            <div className="flex lg:hidden flex-col items-center">
              <Instagram width={20} height={20} /> <p className="m-0 text-md">@ludidactas</p>{' '}
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
