import { titulo } from '@/components/fonts'
import Image from 'next/image'
import Link from 'next/link'
import lemaSketchy from '@/img/lema_sketchy.gif'
import Personajito from '@/svg/components/personajito'

const LogoLema = () => {
  return (
    <Link className="logolema w-[60vw]" href="/">
      <div className="flex md:w-[48em] items-center gap-4">
        <Personajito className="w-12 md:w-24" paso={1800} amplitud={18} mancha="000000" />
        <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1 dark:text-slate-50 w-[60%]">
          <Image className="w-[300px] md:w-[800px] h-auto" src={lemaSketchy} alt="Ludidactas" />
          <p className={`${titulo.className} m-0 text-nowrap md:text-[1em]`}>Educación emergente </p>
        </div>
      </div>
    </Link>
  )
}

export default LogoLema
