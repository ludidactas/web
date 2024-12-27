'use client'
import { ButtonIcon } from "@/components/custom/ld-btn"
import LogoLema from "./logoLema"

export default function Header() {

    return (
        <div className="flex flex-col items-center w-[60%] m-[20%]">
            
            <LogoLema />
            <img src="/img/Compo.png" />
            {/* scrollTo es una funcion que te da window, se puede usar el nombre directamente */}
            <ButtonIcon onClick={() => scrollTo({
                // window.innerHeigth toma el alto de la pantalla
                top: window.innerHeight,
                behavior: "smooth",
            })} />

        </div>

    )
}
