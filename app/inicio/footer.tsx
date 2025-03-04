import Link from 'next/link'
import { Instagram } from 'lucide-react'
import Image from 'next/image'
import { Jersey } from '@/components/fonts'

export default function Footer() {
  return (
    <div className="flex flex-col items-center bg-slate-200/50 text-center pt-10">
      <div className="flex flex-col items-center text-center font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[15px] pt-1 dark:text-slate-50 ">
                   <Image  src="/img/Logo.png" alt={""} width={100} height={100} />
        <div className="flex items-center">
                    <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1 dark:text-slate-50">
                      <Image className="" src="/img/Lema.png" alt={""} width={300} height={300}/>
                       <p className={`${Jersey.className} text-[1em] m-0`}>Tecnologías pedagógicas emergentes </p>
                   </div>
               </div>
        <div className={`${Jersey.className} m-5`}>
          <p className='m-0'>Córdoba, Argentina</p>
          <p className='m-0'>2025</p>
        </div>
        <Link className={`${Jersey.className} flex flex-col items-center`} href="https://www.instagram.com/ludidactas/" target="_blank">
          <Instagram width={35} height={35}  /> <p className="m-0  mb-10 text-2xl">@ludidactas</p>{' '}
        </Link>
      </div>
    </div>
  )
}
