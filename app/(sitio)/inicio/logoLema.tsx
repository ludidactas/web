import { titulo } from '@/components/fonts'
import Image from 'next/image'
import Link from 'next/link'

const LogoLema = () => {
  return (
    <Link className="logolema w-[60vw]" href="/inicio">
      <div className="flex md:w-[48em] items-center gap-4">
        <img className="w-10 md:w-24" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
        <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1 dark:text-slate-50 w-[60%]">
          <img className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
          <p className={`${titulo.className} m-0 text-nowrap md:text-[1em]`}>Educación emergente </p>
        </div>
      </div>
    </Link>
  )
}

export default LogoLema
