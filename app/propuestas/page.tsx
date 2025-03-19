'use client'
import { Jersey } from '@/components/fonts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Waypoints } from 'lucide-react';

import Image from 'next/image'
import Link from 'next/link';
import { useState } from 'react';

const Convocatoria = () => {
  return <div>

  </div>

}
interface FormatosProps {
  formato: string,
  descripcion: string

}

const Formatos = ({ formato, descripcion }: FormatosProps) => {
  return <div
    data-aos="fade-left"
    data-aos-duration="2000"
    data-aos-delay="100"
    className="border-2 border-[#06b6d4] border-solid h-full p-4 rounded-xl "
  >

    <h1 className="flex text-xl md:text-2xl font-bold place-content-center my-4 text-center text-[rgb(6,182,212)] drop-shadow-lg">
      <Waypoints className='w-20' />
      {formato}
      <Waypoints className='w-20' />
    </h1>
    <p className="m-2 text-[1rem] md:text-lg">
      {descripcion}
    </p>
  </div>
}

const FormatosModulo = () => {
  return (
    <div className="md:mt-20 md:mx-15 flex flex-col items-center text-center rounded-xl md:pt-10">
      <h2 className="text-center font-bold text-xl md:text-3xl w-fit px-10 rounded-x bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text">
        Las propuestas se ofrecen en formato seminario, taller y clases particulares
      </h2>

      <div className="bg-white flex flex-col md:grid md:grid-cols-3 gap-4 place-content-between m-10 md:m-20">

        <Formatos formato='Seminario' descripcion='Son instancias de una o dos clases intensivas y largas en las que vemos de manera introductoria algún tema
            puntual. Es ideal para almas autodidactas que pueden aprovechar una buena rampa de entrada a un tema que
            les evite el famoso &quot;infierno de tutoriales&quot;.'/>

        <Formatos formato='Talleres' descripcion=' Son instancias largas, recurrentes, orientadas alrededor de una línea de desarrollo de proyectos. Es ideal
            para almas aplicadas, que disfruten el trabajo en equipo, y la buena cosecha que sigue a una buena
            siembra.'/>
        <Formatos formato='Clases Particulares' descripcion='Son para vos si sabés lo querés y vas con toda en esa dirección, o si apreciás el fruto de un trabajo
            sostenido y preferís el mentoreo individual.'/>

      </div>
    </div>

  )
}

interface LineasProps {
  titulo: string
  descripcion: string
  lista: string[]
  btntxt: string
  imagen: JSX.Element
  btnurl: string
}

const Lineas = ({ titulo, descripcion, imagen, lista, btntxt, btnurl }: LineasProps) => {

  return <div className="flex flex-col md:flex-row w-fit mx-4 md:w-[800px] m-4 md:m-10 border-2 p-4 md:px-10 border-dashed border-black rounded-xl items-center md:gap-8" data-aos="fade-up" data-aos-duration="1000">


    <h1 className={`${Jersey.className} bg-gradient-to-b from-cyan-500 to-violet-500 text-transparent bg-clip-text drop-shadow-lg text-4xl md:text-7xl md:w-fit font-bold md:[writing-mode:vertical-rl] md:[text-orientation:upright]`}>
      {titulo} </h1>

    <div className='flex bg-white/80 flex-col md:py-10 md:gap-4  rounded-xl'>
      <div className='flex flex-col items-center md:p-5 md:gap-4'>

        <h3 className='text-[1rem] md:text-2xl m-4 text-center font-semibold text-[#06b6d4]'>
          {descripcion}
        </h3>

        {imagen}

      </div>
      <ul className='flex flex-col font-bold text-center gap-4 p-4 md:px-10 text-[1rem] md:text-lg'>
        {lista.map(txt => (<li key={txt}> •  {txt}</li>))}
      </ul>

      <Link className="custom-btn btn-15 w-fit text-xs self-center" href={btnurl}> {btntxt}</Link>
    </div>

  </div>


}


const LineasModulo = () => {
  return (
    <div className="flex flex-col m-4 md:m-10 md:px-20 md:mx-20 items-center justify-center ">

      <div className="p-4 text-center  md:px-10 bg-white rounded-xl text-[1rem] md:text-2xl">
        <h2 data-aos="fade-left" className={`${Jersey.className} text-4xl bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text drop-shadow-lg md:text-7xl`}>
          Líneas de contenido
        </h2>
        <p className='m-4'>
          {' '}
          Hemos desarrollado un esquema que nos permite ofrecer <span className='font-bold text-[#06b6d4]'>oportunidades de formación para todos los niveles de
            aprendizaje, en módulos cortos y autoconclusivos</span>. Los módulos propuestos se corresponden con determinados
          temas y relaciones. Así mismo, varios módulos pueden llegar a aparecer en un solo taller o encontrarse
          reiterados en varios talleres. No todas las correlatividades son difíciles</p>
        <p className='font-bold text-[#06b6d4]'>¡Consultanos!</p>

      </div>

      <Lineas
        titulo="TÉCNICA"
        descripcion="Aprendemos mediante la experiencia en grupo, bajo la premisa de que lxs alumnxs puedan recibir a quienes lleguen y tener la oportunidad para guiar a lxs otrxs y poner en práctica lo aprendido. Así para cualquier nivel hay alguien a quien nutre ese encuentro. Los espacios técnicos funcionan mejor con contribución estable y compromiso a largo plazo"
        lista={['Formación grupal, abierta a todo público.',
          'Talleres, cursos y seminarios orientados a la transmisión de conocimientos técnicos en las áreas de programación, animación, desarrollo de videojuegos y otras tecnologías y herramientas asociadas']}
        btntxt='Próximamente...'
        btnurl=''
        imagen={<Image className='w-fit h-fit self-center rounded-full' src='/img/grupopixel.jpeg' alt='' width={150} height={150} />} />

      <Lineas
        titulo='DIDÁCTICA'
        descripcion='En la línea Didáctica nos enfocamos en el proceso de transmisión:  el cómo y las condiciones para enseñar o instruir'
        lista={['Linea de contenido dirigida a docentes o personas que estén interesadas en la enseñanza de estas tecnologías y en el desarrollo propio de los medios asociados tales como la elaboración de rutas de aprendizaje, la eleccion y el desarrollo de las modalidades y las herramientas necesarias.',
          'Las distintas modalidades se encuentran orientadas hacia poner en práctica las tecnologías y herramientas aprendidas en la etapa técnica']}
        btntxt='Convocatoria Ludidáctica'
        btnurl='/convocatoria'
        imagen={<Image className='w-fit h-fit self-center rounded-full' src='/img/grupopixel2.jpeg' alt='' height={150} width={150} />} />

      <Lineas
        titulo='PEDAGÓGICA'
        descripcion='En la línea pedagógica exploramos la relación humana con el proceso educativo. ¿Qué hace allí el docente? ¿Desde dónde se para? ¿Cómo decide qué va a mostrar? ¿Qué muestra -es decir, enseñando- con su actutid, sus acciones, su forma de estar? ¿Cuál es el proyecto político y cultural que incorpora?'
        lista={['Orientada a la comunidad educativa en general, principalmente a personas que se implique en el aspecto regenerativo/reflexivo del proyecto.',
          'Expresada en encuentros, charlas, conversatorios y escritos']}
        btntxt='Ver blog'
        btnurl='https://ludidactas.medium.com/'
        imagen={<Image className='w-fit h-fit self-center rounded-full' src='/img/grupopixel2.jpeg' alt='' height={150} width={150} />} />


    </div>
  )
}


const LogoTec = ({ nombre, url, descripcion }: { nombre: string; url: string; descripcion: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={0}> {/* Disables hover delay */}
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        onClick={() => setOpen(!open)}>
        <Image className="w-fit h-fit md:w-full md:h-full " src={url} width={100} height={100} alt="" />
      </TooltipTrigger>
        <TooltipContent className="bg-black text-center text-white w-[20em] p-5">
          <h1 className="text-2xl pb-2 text-[#4198AA]">{nombre}</h1>
          <p className='text-center'>{descripcion}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

   

  )
}
const Tecnologias = () => {
  return (
    <div className='mx-8 md:m-20 rounded-xl bg-slate-100/50'>
      <h1 data-aos="fade-left" className={`${Jersey.className} m-4 md:m-10 pt-10 drop-shadow-lg text-4xl text-center md:text-7xl bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text`}>
        Tecnologías
      </h1>
      <p className=" font-bold text-center md:p-8 mx-4 text-[1rem] md:text-3xl ">
        Todas las propuestas se encuentran dirigidas a cualquier persona que busque formarse en cada una de las líneas de contenido y -en el caso de la línea técnica- en cada una de las{' '}
        <span className="font-bold text-cyan-500">tecnologías con las que trabajamos.</span>
      </p>

      <div className="grid grid-cols-3 gap-[40px] p-10 md:p-20 place-items-center ">
        <LogoTec
          nombre="Python"
          url="/img/tecnologias/python.png"
          descripcion="El lenguaje preferido para aprender programación, incluyendo coding, algoritmos, paradigmas, patrones y prácticas de ingeniería de software."
        />
        <LogoTec
          nombre="Godot"
          url="/img/tecnologias/godot.png"
          descripcion="Un simple pero poderoso motor de videojuegos opensource, con todo para aprender gamedev."
        />
        <LogoTec
          nombre="Scratch"
          url="/img/tecnologias/scratch.png"
          descripcion="Una plataforma del MIT para enseñar programación a niños y niñas. Más poderoso de lo que puede parecer a primera vista..."
        />
        <LogoTec
          nombre="HTML, CSS Y JS"
          url="/img/tecnologias/web.png"
          descripcion="Los lenguajes nativos de la web, y la base absolutamente fundamental para escribir páginas web."
        />
        <LogoTec
          nombre="Node"
          url="/img/tecnologias/node.png"
          descripcion="El entorno de javascript para servidores, y la pieza fundamental para escribir aplicaciones fullstack en js. Incluye tooling como buildpack y frameworks como express."
        />
        <LogoTec
          nombre="React"
          url="/img/tecnologias/react.png"
          descripcion="El framework web más popular de nuestros días. Tip: hacé una búsqueda de empleo de 'desarrollador react' "
        />
        <LogoTec
          nombre="Terminal"
          url="/img/tecnologias/bash.png"
          descripcion="Vim, Ssh, tcpdump y otras yerbas del manejo de servidores old school. Orientado a linux."
        />
        <LogoTec
          nombre="Git"
          url="/img/tecnologias/git.png"
          descripcion="El sistema de repositorios de código que nos devuelve la cordura y nos permite trabajar en equipos. Un must si estás buscando laburo."
        />
        <LogoTec
          nombre="Matemática"
          url="/img/tecnologias/pi.png"
          descripcion="La primer tecnología. No es secreto que muchas cosas en la programación se describen a través de matemática, en especial en el universo de gráficos y videojuegos. Un submundo aguarda."
        />
        <LogoTec
          nombre="Processing"
          url="/img/tecnologias/processing.png"
          descripcion="Un entorno de programación de gráficos concebido para el encuentro entre la programación y la animación por código, eminentemente didáctico. Se programa en Python o Java y tiene un alter-ego web en javascript llamado p5js (el fondo interactivo de esta página está construido con esta tecnología)."
        />
        <LogoTec
          nombre="Piskel"
          url="/img/tecnologias/piskelapp.png"
          descripcion="Un app libre para animación de sprites cuadro por cuadro en Pixel art. Con esto animamos personajes."
        />
        <LogoTec
          nombre="Affinity Designer"
          url="/img/tecnologias/affinity.png"
          descripcion="Una poderosísima herramienta de ilustración que integra gráficos vectoriales y rastrer como si se tratara de manteca y miel."
        />
      </div>
    </div>

  )
}

export default function Page() {
  return (
    <>
      <Convocatoria />
      <LineasModulo />
      <FormatosModulo />
      <Tecnologias />
    </>
  )


}
