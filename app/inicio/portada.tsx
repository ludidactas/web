'use client'
import { CircleChevronDown } from "lucide-react"
import Image from "next/image"
import {Link} from 'react-scroll'

const PortadaDesktop=() =>{

    return (
        <div className=" portadaini flex mb-20 flex-col items-center ">                    
            <Image className="mt-10"src="/img/Compo.png" alt="PortadaImg" width={700} height={700}/>
            <h3 className="mx-80 mb-20 text-center"> <span className="text-[#4198AA]">Aprendé a crear recursos educativos desautomatizados,</span> entrenando el arte de la programación, las animaciones y los videojuegos.</h3>
            <div className="w-10">
            <Link to="identidadini" smooth={true} duration={500}><CircleChevronDown className=" bg-white/50 rounded-full [animation:bounce_0.8s_infinite] hover:text-white hover:bg-[#06b6d4] w-full h-full" /></Link>

            </div>
        </div>

    )
}

const PortadaMobile=()=>{
    return(
        <div className=" portadaini flex mb-20 flex-col items-center ">                    
            <Image className="mt-10"src="/img/Compo.png" alt="PortadaImg" width={200} height={200}/>
            <h3 className="mx-20 mb-5 text-xs text-center"> <span className="text-[#4198AA]">Aprendé a crear recursos educativos desautomatizados,</span> entrenando el arte de la programación, las animaciones y los videojuegos.</h3>            
            <Link to="identidadini" smooth={true} duration={500}><CircleChevronDown className=" bg-white/50 rounded-full [animation:bounce_0.8s_infinite] hover:text-white hover:bg-[#06b6d4]" /></Link>

           
        </div>
        
    )
}

const Portada =()=>{
    return<>
    <div className="block md:hidden">
      <PortadaMobile/>
    </div>
    <div className={'hidden md:block'}>
        <PortadaDesktop/>
    </div>
    
    </>
}

export default Portada;