import PropCont from "@/app/propuestas/propuestasCont.mdx"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"

const LogoTec = ({ nombre, url, descripcion }: { nombre: string; url: string; descripcion: string }) => {
    return <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger>
                <Image className="w-full h-full" src={url} width={100} height={100} alt="" />
            </TooltipTrigger>
            <TooltipContent className="bg-black text-white w-[20em] p-5">
                <h1 className="text-2xl pb-2 text-[#4198AA]">{nombre}</h1>
                {descripcion}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>

}

export default function Page() {
    return <div>
        <div className="propuestas">
            <PropCont />
        </div>
        <div className="text-center text-white p-10 bg-[#1e1e1e]">
            <h1 id="tecnologias" className="m-10">Tecnologías</h1>
            <div className=" grid grid-cols-3 gap-[40px] m-10 p-10 place-items-center ">
                <LogoTec nombre="Python" url="/img/tecnologias/python.png" descripcion="El lenguaje preferido para aprender programación, incluyendo coding, algoritmos, paradigmas, patrones y prácticas de ingeniería de software." />
                <LogoTec nombre="Godot" url="/img/tecnologias/godot.png" descripcion="Un simple pero poderoso motor de videojuegos opensource, con todo para aprender gamedev." />
                <LogoTec nombre="Scratch" url="/img/tecnologias/scratch.png" descripcion="Una plataforma del MIT para enseñar programación a niños y niñas. Más poderoso de lo que puede parecer a primera vista..." />
                <LogoTec nombre="HTML, CSS Y JS" url="/img/tecnologias/web.png" descripcion="Los lenguajes nativos de la web, y la base absolutamente fundamental para escribir páginas web." />
                <LogoTec nombre="Node" url="/img/tecnologias/node.png" descripcion="El entorno de javascript para servidores, y la pieza fundamental para escribir aplicaciones fullstack en js. Incluye tooling como buildpack y frameworks como express." />
                <LogoTec nombre="React" url="/img/tecnologias/react.png" descripcion="El framework web más popular de nuestros días. Tip: hacé una búsqueda de empleo de 'desarrollador react' " />
                <LogoTec nombre="Terminal" url="/img/tecnologias/bash.png" descripcion="Vim, Ssh, tcpdump y otras yerbas del manejo de servidores old school. Orientado a linux." />
                <LogoTec nombre="Git" url="/img/tecnologias/git.png" descripcion="El sistema de repositorios de código que nos devuelve la cordura y nos permite trabajar en equipos. Un must si estás buscando laburo." />
                <LogoTec nombre="Matemática" url="/img/tecnologias/pi.png" descripcion="La primer tecnología. No es secreto que muchas cosas en la programación se describen a través de matemática, en especial en el universo de gráficos y videojuegos. Un submundo aguarda." />
                <LogoTec nombre="Processing" url="/img/tecnologias/processing.png" descripcion="Un entorno de programación de gráficos concebido para el encuentro entre la programación y la animación por código, eminentemente didáctico. Se programa en Python o Java y tiene un alter-ego web en javascript llamado p5js." />
                <LogoTec nombre="Piskel" url="/img/tecnologias/piskelapp.png" descripcion="Un app libre para animación de sprites cuadro por cuadro en Pixel art. Con esto animamos personajes." />
                <LogoTec nombre="Affinity Designer" url="/img/tecnologias/affinity.png" descripcion="Una poderosísima herramienta de ilustración que integra gráficos vectoriales y rastrer como si se tratara de manteca y miel." />
            </div>
        </div>
    </div>

}

