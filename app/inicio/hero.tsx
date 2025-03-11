import { Jersey } from "@/components/fonts"

import Image from "next/image"
import Link from "next/link"

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
    return (<div data-aos-duration="1000" className={className} >
        <div className="flex flex-col p-4 bg-white border-2 border-black border-dashed rounded-xl">

            <div className={`${Jersey.className} items-center flex gap-2 `} >
                <Image className="w-full h-full" width={120} height={120} src={"/img/CONVOCATORIA.png"} alt={""} />

                <div className="flex flex-col items-center rounded-xl border-2 p-2 border-black border-dashed text-center">
                    <p className="m-0 pb-2 text-xs ">Convocamos a personas interesadas en <span className="font-bold">practicar</span> el rol docente/didáctico/pedagógico y dispuestas a ocupar también el
                        de aprendientes.</p>
                    <p className="text-xs text-indigo-500 m-0">¡Si estás interesadx, accedé a la info completa y escribinos!</p>

                </div>

            </div>
            {/* <Image className="rounded-full w-fit border-2 shadow-xl" src="/img/Grupo.webp" alt="" width={150} height={150} /> */}

            <div className="w-fit self-center text-[0.5em]">

                <Link className="custom-btn btn-15 p-0 mt-0 w-fit text-[0.2rem] text-center" href="/convocatoria">Ver convocatoria</Link>
            </div>

        </div>
    </div>


    )

}

const Hero = () => {
    return (
        <>
            <div className="heroini block md:hidden">
                <HeroMobile className="heroini flex flex-col border-solid border-2 border-black rounded-xl p-2 m-2 bg-gradient-to-r from-cyan-500/50 to-blue-500/50" />
            </div>
            <div className='hidden md:block'>
                <HeroDesktop className="heroini self-center w-[1300px] border-solid border-4 border-black rounded-xl flex gap-2 p-5 items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50" />

            </div>
        </>
    )
}

export default Hero;