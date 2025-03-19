'use client'

import { Jersey } from "@/components/fonts"
import { CircleChevronDown } from "lucide-react";

import Image from "next/image"
import Link from "next/link"
import { Link as Scroll } from 'react-scroll';


interface HeroProps {
    className: string
}

const HeroDesktop = ({ className }: HeroProps) => {
    return (
        <div data-aos='zoom-out' data-aos-duration="1000" className={className} >
            <Image className="[animation:bounce_2s_infinite]" width={300} height={300} src={"/img/CONVOCATORIA.png"} alt={""} />
            <div className={`${Jersey.className} flex gap-2 p-6 bg-white border-4 border-black border-dashed rounded-xl`} >
                <div className="flex items-center flex-col ">

                    <p className="text-left m-0 text-3xl">Convocamos a personas interesadas en <span className="font-bold">practicar</span> el rol docente/didáctico/pedagógico y dispuestas a ocupar también el
                        de aprendientes.</p>
                    <p className="text-3xl text-indigo-500 m-0">¡Si estás interesadx, accedé a la info completa y escribinos!</p>

                    <Link className="custom-btn btn-15 w-40 text-center" href="/convocatoria">Convocatoria</Link>

                </div>
                <Image className="rounded-full w-fit border-2 shadow-xl" src="/img/Grupo.webp" alt="" width={150} height={150} />

            </div>
        </div>
    )
}

const HeroMobile = ({ className }: HeroProps) => {
    return (
    <div data-aos-duration="1000" className={className} >    
        <div className={`${Jersey.className} flex-col h-max items-center flex gap-2 p-4 bg-white border-2 border-black border-dashed rounded-xl`}>

                    <Image className="w-[45vW]" width={400} height={400} src={"/img/CONVOCATORIA.png"} alt={""} />
                    <p className="text-2xl text-center p-4">Convocamos a personas interesadas en <span className="font-bold">practicar</span> el rol docente/didáctico/pedagógico y dispuestas a ocupar también el
                        de aprendientes.</p>
                    <h3 className="text-3xl p-4 text-center bg-yellow-100 border-4 border-dashed border-black rounded-xl">¡Si estás interesadx, accedé a la info completa y escribinos!</h3>

                <Link className="custom-btn btn-15 w-[35vw] text-center" href="/convocatoria">Convocatoria</Link>

        </div>
        <div className="w-[8vw] my-10">

        <Scroll to="portadaini" smooth={true} duration={500}><CircleChevronDown className="animate-bounce bg-white rounded-full w-full h-full" /></Scroll>
        </div>

    </div>


    )

}

const Hero = () => {
    return (
        <>
            <div className="block md:hidden">
                <HeroMobile className="flex flex-col items-center h-max border-solid border-2 border-black rounded-xl p-4 bg-gradient-to-r from-cyan-500/50 to-blue-500/50" />
            </div>
            <div className='hidden md:block'>
                <HeroDesktop className="heroini self-center w-[1300px] border-solid border-4 border-black rounded-xl flex gap-2 p-5 items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50" />

            </div>
        </>
    )
}

export default Hero;