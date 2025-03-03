'use client'
import { CircleChevronDown } from "lucide-react"
import Image from "next/image"
import {Link} from 'react-scroll'

export default function Portada() {

    return (
        <div className=" portadaini flex flex-col items-center ">                    
            <Image className="mt-10"src="/img/Compo.png" alt="PortadaImg" width={700} height={700}/>
            <h3 className="w-[40%] mb-10"> <span className="text-[#4198AA]">Aprendé a crear recursos educativos desautomatizados,</span> entrenando el arte de la programación, las animaciones y los videojuegos.</h3>
            {/* scrollTo es una funcion que te da window, se puede usar el nombre directamente */}
            <div className="w-10">
            <Link to="identidadini" smooth={true} duration={500}><CircleChevronDown className="[animation:bounce_0.5s_infinite] w-full h-full" /></Link>

            </div>
        </div>

    )
}
