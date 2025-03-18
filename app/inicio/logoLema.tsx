import { Jersey } from "@/components/fonts"
import Image from "next/image"
import Link from "next/link"

const LogoLemaDesktop=()=> {

    return<Link className='logolema' href="/inicio">
        <div className="flex w-[48em] items-center">
            <Image  src="/img/Logo.png" alt={""} width={180} height={180} />
             <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1 dark:text-slate-50 w-[60%]">
               <Image className="" src="/img/Lema.png" alt={""} width={800} height={800}/>
                <p className={`${Jersey.className} text-[1em] m-0`}>Tecnologías educativas emergentes </p>
            </div>
        </div>
    </Link>
}

const LogoLemaMobile=()=>{
    return<Link className='logolema w-[60vw]' href='inicio'>
        <div className="flex items-center">
            <Image  className="w-10" src="/img/Logo.png" alt={""} width={100} height={100} />
             <div className="font-medium text-[10px] md:text-[14px] lg:text-[18px] pt-1 dark:text-slate-50 w-[60%]">
               <Image className="" src="/img/Lema.png" alt={""} width={200} height={200}/>
                <p className={`${Jersey.className} m-0`}>Tecnologías educativas emergentes </p>
            </div>
        </div>
    </Link>
}
const LogoLema=()=>{
    return(
      <>
        <div className="block md:hidden">
          <LogoLemaMobile />
        </div>
        <div className='hidden md:block'>
          <LogoLemaDesktop />
        </div>
      </>
    )
}

export default LogoLema;