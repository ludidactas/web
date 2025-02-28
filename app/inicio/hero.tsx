import { Pixelify } from "@/components/fonts"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/ld-carousel"
import Image from "next/image"
import Link from "next/link"


export default function Hero() {
    return <div className="flex  justify-center ">
        <Carousel className="w-[1300px] ">
            <CarouselContent>

                <CarouselItem className="flex gap-4 p-10 items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50" >
                    <p className={`${Pixelify.className} text-6xl text-center `}>CONVOCATORIA LUDIDáCTICA</p>
                    <div className="flex gap-4 p-10 bg-white rounded-xl" >
                        <div className="flex items-center flex-col ">
                            <p className=" text-3xl mb-5  ">Convocamos a personas interesadas en <span className="font-bold">practicar</span> el rol docente/didáctico/pedagógico y dispuestas a ocupar también el
                                de aprendientes
                               
                            </p>
                            <Link className="custom-btn btn-15 w-40 text-center" href="/propuestas/convocatoria">Ver más</Link>
                        
                        </div>
                                <Image className="rounded-full border-2 shadow-xl" src="/img/Grupo.webp" alt="" width={300} height={300} />

                

                    </div>
                </CarouselItem>
                <CarouselItem className=" place-content-center items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50" >
                    <p>para sostener un taller anual de tecnología (programación, ilustración digital, producción musical, y cualquier
                        disciplina aledaña). No necesitás ningún título ni certificación, solo el interés genuino.</p>
                </CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    </div>
}