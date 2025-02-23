'use client'
import { ButtonIcon } from "@/components/custom/ld-btn"
import LogoLema from "./logoLema"
import Image from "next/image"

export default function Portada() {

    return (
        <div className="flex flex-col items-center ">                    
            <Image className="mt-10"src="/img/Compo.png" alt="PortadaImg" width={700} height={700}/>
            <h3 className="w-[40%] mb-10"> <span className="text-[#4198AA]">Aprendé a crear recursos educativos desautomatizados,</span> entrenando el arte de la programación, las animaciones y los videojuegos.</h3>
            {/* scrollTo es una funcion que te da window, se puede usar el nombre directamente */}
            <ButtonIcon onClick={() => scrollTo({
                // window.innerHeigth toma el alto de la pantalla
                top: window.innerHeight,
                behavior: "smooth",
            })} />

        </div>

    )
}
