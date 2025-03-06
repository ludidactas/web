import { Jersey} from "@/components/fonts"

import Image from "next/image"
import Link from "next/link"

interface HeroProps{
    className:string
}

export default function Hero({className}:HeroProps) {
    return <div data-aos='zoom-out' data-aos-duration="1000" className={className} >
                    <Image className="[animation:bounce_2s_infinite]" width={300} height={300}src={"/img/CONVOCATORIA.png"} alt={""}/>
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
                {/* <CarouselItem className=" place-content-center items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50" >
                    <p>para sostener un taller anual de tecnología (programación, ilustración digital, producción musical, y cualquier
                        disciplina aledaña). No necesitás ningún título ni certificación, solo el interés genuino.</p>
                </CarouselItem> */}
            
            
     
    
}