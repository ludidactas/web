'use client'
import { ButtonIcon } from "@/components/custom/ld-btn"
import LogoLema from "./logoLema"
import Image from "next/image"

export default function Portada() {

    return (
        <div className="flex flex-col items-center ">
            
            
            <Image src="/img/Compo.png" alt="PortadaImg" width={500} height={500}/>
            {/* scrollTo es una funcion que te da window, se puede usar el nombre directamente */}
            <ButtonIcon onClick={() => scrollTo({
                // window.innerHeigth toma el alto de la pantalla
                top: window.innerHeight,
                behavior: "smooth",
            })} />

        </div>

    )
}
