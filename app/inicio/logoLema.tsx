import { Jersey } from "@/components/fonts"
import Image from "next/image"
import Link from "next/link"

export default function LogoLema() {

    return<Link href="/inicio">
        <div className="flex w-[48em] items-center">
            <Image  src="/img/Logo.png" alt={""} width={180} height={180} />
             <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1 dark:text-slate-50 w-[60%]">
               <Image className="" src="/img/Lema.png" alt={""} width={800} height={800}/>
                <p className={`${Jersey.className} text-[1em] m-0`}>Tecnologías pedagógicas emergentes </p>
            </div>
        </div>
    </Link>
}

