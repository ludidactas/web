import Link from "next/link";
import {Instagram} from "lucide-react";


export default function Footer() {
    return <div className="flex flex-col items-center bg-slate-200 text-center pt-10">
        <div className="flex flex-col items-center text-center w-[20%] font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[15px] pt-1 dark:text-slate-50 w-[20%]">
            <img className="w-[20%]" src="/img/Logo.png" />
            <img className="" src="/img/Lema.png" />
            <p>Tecnologías pedagógicas emergentes </p>
            <div className="p-10">
                <p>Córdoba, Argentina</p>
                <p>2025</p>
            </div>
            <Link className="flex flex-col items-center pb-10" href="https://www.instagram.com/ludidactas/" target="_blank">
            <Instagram className="" /> <p>@ludidactas</p> </Link>
        </div>
    </div>
}