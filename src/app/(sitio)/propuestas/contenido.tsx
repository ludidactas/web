'use client'
import DidacticaIlus from '@/svg/dist/propuestas/didáctica.svg'
import PedagogiaIlus from '@/svg/dist/propuestas/pedagogía.svg'
import { LinkGradiente } from '@/components/custom/ld-link-gradiente'
import { LdSvg } from '@/components/custom/ld-svg'
import TecnicaIlus from '@/svg/dist/propuestas/técnica.svg'
import Image from 'next/image'
import Link from 'next/link'
import ShapeDividerWaves from '../custom/shape-divider'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Title } from '@/components/custom/ld-title'
import { BotonLink } from '@/components/custom/ld-boton-svg'

interface FormatosProps {
  formato: string
  descripcion: string
  icono: string
}

const Formatos = ({ formato, descripcion, icono }: FormatosProps) => {
  return (
    <div
      data-aos="fade-left"
      data-aos-duration="2000"
      data-aos-delay="100"
      className="bg-white h-full w-full p-4 rounded-2xl md:w-full"
    >
      <h1 className={`flex text-xl lg:text-3xl font-bold items-center my-4 justify-center text-ld-azul`}>
        <Icon className="mx-2 h-10 w-10" icon={icono} />
        {formato}
      </h1>
      <p className="m-2 text-[1rem] lg:text-lg">{descripcion}</p>
    </div>
  )
}


interface LineasProps {
  titulo: JSX.Element
  descripcion: string
  lista: string[]
  btn: JSX.Element
  imagen: React.ReactNode
}

const styletitle = ' drop-shadow-[2px_2px_2px_rgba(0,0,0)] w-80 md:w-[900px] justify-center'

const Lineas = ({ titulo, descripcion, imagen, lista, btn }: LineasProps) => {
  return (
      <div
        className="flex flex-col my-10 mx-6 rounded-xl items-center gap-10"
        data-aos="fade-in"
        data-aos-duration="1000"
      >

        {titulo}

        <div className="flex flex-col justify-between items-center rounded-xl bg-white/90 h-full pb-6">
          <div className="flex flex-col items-center  lg:gap-4">
            <LdSvg className="w-40 md:w-96 -translate-y-5" SvgComponent={imagen} />
            <h3 className="text-[1rem] lg:text-2xl m-4 text-center font-semibold text-ld-azul">{descripcion}</h3>
          </div>
          <ul className="flex flex-col text-center gap-4 p-4 lg:px-10 text-[1rem] lg:text-lg">
            {lista.map((txt) => (
              <li key={txt}> • {txt}</li>
            ))}
          </ul>
    
            {btn}
            
        </div>
      </div>
  )
}

const LineasModulo = () => {
  return (
    <div className="flex flex-col items-center w-screen">
      <div className="flex flex-col text-center items-center p-4 max-w-[1480px] lg:px-24 text-sm lg:text-2xl mb-20 bg-white/50">
        <div className='mb-6'>
        <Title text='Líneas de Contenido' color={'text-ld-violeta'} size={'text-5xl md:text-7xl'} />
        </div>
        <p className="mt-16">
          Hemos buscado desarrollar un esquema que nos permita ofrecer{' '}
          <span className="font-bold text-ld-azul">oportunidades de formación para todo el mundo.</span>{' '}
        </p>
        <p className="m-4">
          La clave está en la <span className="font-bold text-ld-violeta">flexibilidad</span> debida a{' '}
          <LinkGradiente href="/identidad">nuestras necesidades identitarias</LinkGradiente>. En los talleres, los
          estudiantes más avanzados enseñan a los más nuevos y así practican también la didáctica. El material
          generado durante las clases particulares se pone a disposición como recursos para que sirva a autodidactas y
          otrxs profes. En los seminarios directamente se dispensa la formación técnica y en el blog se publicamos
          textos sobre pedagogía y enseñanza al público general.
        </p>
        <Link className="hover:scale-110" href="https://instagram.com/ludidactas">
          <Title text='¡Consúltanos!' color={'text-ld-azul'} size={'text-4xl md:text-7xl'} />
        </Link>
      </div>

      <ShapeDividerWaves top colorText={'text-indigo-500/30'} />
      <div className=" bg-indigo-500/30 w-full gap-2 mx-10">

        {/* Lineas */}
        <div className="flex flex-col md:grid md:grid-cols-3">
          <Lineas
            titulo={<Title radius={2} text='Técnica' color={'text-ld-violeta'} size={'text-4xl md:text-6xl'} />}

            descripcion="Aprendemos mediante la experiencia en grupo, en talleres grupales estables o seminarios de temas específicos"
            lista={[
              'Formación grupal, abierta a todo público.',
              'Talleres, cursos y seminarios orientados a la transmisión de conocimientos técnicos en las áreas de las que haya profes. De momento son programación, animación, desarrollo de videojuegos y otras tecnologías y herramientas asociadas',
              'Estructura modular. Los módulos siguen líneas, temas y relaciones. Así mismo, varios módulos pueden llegar a aparecer en un solo taller o encontrarse reiterados en varios talleres. No todas las correlatividades son difíciles.',
            ]}
            btn={<BotonLink disabled titulo={'Próximamente...'} url={''} />}
            imagen={TecnicaIlus}
          />

          <Lineas
            titulo={<Title radius={2}  text='Didáctica' color={'text-ld-violeta'} size={'text-4xl md:text-6xl'} />}
            descripcion="En la línea Didáctica nos enfocamos en el proceso de transmisión:  el cómo y las condiciones para enseñar o instruir"
            lista={[
              'Dirigida a talleristas, docentes o personas que estén interesadas en la enseñanza de estas tecnologías y en el desarrollo de las actividades y los materiales que les son propios tales como rutas de aprendizaje, guías de ejercicios, trabajos prácticos, etc.',
              'Las distintas modalidades se encuentran orientadas hacia poner en práctica las tecnologías y herramientas aprendidas en la etapa técnica',
            ]}
            btn={<BotonLink titulo={'Convocatoria'} url={'/convocatoria'} />}
            imagen={DidacticaIlus}
          />
          <Lineas
            titulo={<Title radius={2}  text='Pedagógica' color={'text-ld-violeta'} size={'text-4xl md:text-6xl'} />}
            descripcion="En la línea pedagógica exploramos la relación humana con el proceso educativo. ¿Qué hace allí el docente? ¿Desde dónde se para? ¿Cómo decide qué va a mostrar? ¿Qué muestra -es decir, enseña- con su actutid, sus acciones, su forma de estar? ¿Cuál es el proyecto político y cultural que incorpora?"
            lista={[
              'Orientada a la comunidad educativa en general, principalmente a personas implicadas en el aspecto regenerativo/reflexivo del proyecto.',
              'Expresada en encuentros, charlas, conversatorios y escritos',
            ]}
            btn={<BotonLink titulo={'Ver Blog'} url={'/blog'} />}
            imagen={PedagogiaIlus}
          />
        </div>

        {/* Formatos */}
        <div className="lg:mx-15 flex flex-col items-center text-center rounded-xl mt-10 md:mt-20 w-full px-6 lg:px-20">
          <h2 className={`text-center font-bold text-xl lg:text-4xl w-fit px-10 text-indigo-500`}>
            Las propuestas de cada línea de contenido se ofrecen en formato seminario, taller y clases particulares
          </h2>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 justify-between my-10 lg:m-20">
            <Formatos
              icono="streamline-freehand:meeting-presentation"
              formato="Seminario"
              descripcion="Clases intensivas en las que vemos de manera introductoria algún tema puntual. Es ideal para almas autodidactas que pueden aprovechar una introducción a un tema complejo
          y para capacitaciones docentes."
            />
            <Formatos
              icono="streamline-freehand:module-three-boxes"
              formato="Talleres"
              descripcion=" Son instancias recurrentes, orientadas alrededor de una línea de desarrollo de proyectos. Es ideal
            para almas aplicadas, que disfruten el trabajo en equipo y la buena cosecha que sigue a una buena
            siembra."
            />
            <Formatos
              icono="streamline-freehand:collaboration-team-chat"
              formato="Clases Particulares"
              descripcion="Son para vos si sabés lo querés y vas con toda en esa dirección, o si apreciás el fruto de un trabajo
            sostenido y preferís el mentoreo individual."
            />
          </div>
        </div>
      </div>
      <ShapeDividerWaves bottom colorText={'text-indigo-500/30'} />
    </div>
  )
}

const LogoTec = ({ nombre, url, descripcion }: { nombre: string; url: string; descripcion: string }) => {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      {' '}
      {/* Disables hover delay */}
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          className="p-4 hover:outline-8 hover:outline-dashed hover:outline-ld-azul/50 rounded-xl"
          onClick={() => setOpen(!open)}
        >
          <Image className="w-20 h-20 lg:w-full lg:h-full " src={url} width={100} height={100} alt={nombre} />
        </TooltipTrigger>
        <TooltipContent className="bg-black text-center text-white w-[20em] p-5">
          <h1 className="text-2xl pb-2 text-ld-azul-oscuro">{nombre}</h1>
          <p className="text-center">{descripcion}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const Tecnologias = () => {
  return (
    <>
      <div className="flex flex-col px-20 pt-10 h-full bg-white/80">
      <div className='flex justify-center'>
         <div className='mb-6'>
        <Title text='Tecnologías' color={'text-ld-violeta'} size={'text-5xl md:text-7xl'} />
        </div>
      </div>
        <p className=" text-center lg:p-8 mx-4 text-[1rem] lg:text-3xl ">
          Dado que trabajamos principalmente con programación y afines, nuestras propuestas utilizan las siguientes
          tecnologías y están dirigidas a cualquier persona que busque una formación técnico/didáctica.
        </p>
        {/* Logos */}
        <div className="grid grid-cols-3 gap-2 md:gap-[40px] my-6 lg:p-20 place-items-center ">
          <LogoTec
            nombre="Python"
            url="/img/tecnologias/python.webp"
            descripcion="El lenguaje preferido para aprender programación, incluyendo coding, algoritmos, paradigmas, patrones y prácticas de ingeniería de software."
          />
          <LogoTec
            nombre="Godot"
            url="/img/tecnologias/godot.webp"
            descripcion="Un simple pero poderoso motor de videojuegos opensource, con todo para aprender gamedev."
          />
          <LogoTec
            nombre="Scratch"
            url="/img/tecnologias/scratch.webp"
            descripcion="Una plataforma del MIT para enseñar programación a niños y niñas. Más poderoso de lo que puede parecer a primera vista..."
          />
          <LogoTec
            nombre="HTML, CSS Y JS"
            url="/img/tecnologias/web.webp"
            descripcion="Los lenguajes nativos de la web, y la base absolutamente fundamental para escribir páginas web."
          />
          <LogoTec
            nombre="Node"
            url="/img/tecnologias/node.webp"
            descripcion="El entorno de javascript para servidores, y la pieza fundamental para escribir aplicaciones fullstack en js. Incluye tooling como buildpack y frameworks como express."
          />
          <LogoTec
            nombre="React"
            url="/img/tecnologias/react.webp"
            descripcion="El framework web más popular de nuestros días. Tip: hacé una búsqueda de empleo de 'desarrollador react' "
          />
          <LogoTec
            nombre="Terminal"
            url="/img/tecnologias/bash.webp"
            descripcion="Vim, Ssh, tcpdump y otras yerbas del manejo de servidores old school. Orientado a linux."
          />
          <LogoTec
            nombre="Git"
            url="/img/tecnologias/git.webp"
            descripcion="El sistema de repositorios de código que nos devuelve la cordura y nos permite trabajar en equipos. Un must si estás buscando laburo."
          />
          <LogoTec
            nombre="Matemática"
            url="/img/tecnologias/pi.webp"
            descripcion="La primer tecnología. No es secreto que muchas cosas en la programación se describen a través de matemática, en especial en el universo de gráficos y videojuegos. Un submundo aguarda."
          />
          <LogoTec
            nombre="Processing"
            url="/img/tecnologias/processing.webp"
            descripcion="Un entorno de programación de gráficos concebido para el encuentro entre la programación y la animación por código, eminentemente didáctico. Se programa en Python o Java y tiene un alter-ego web en javascript llamado p5js (el fondo interactivo de esta página está construido con esta tecnología)."
          />
          <LogoTec
            nombre="Piskel"
            url="/img/tecnologias/piskelapp.webp"
            descripcion="Un app libre para animación de sprites cuadro por cuadro en Pixel art. Con esto animamos personajes."
          />
          <LogoTec
            nombre="Affinity Designer"
            url="/img/tecnologias/affinity.webp"
            descripcion="Una poderosísima herramienta de ilustración que integra gráficos vectoriales y rastrer como si se tratara de manteca y miel."
          />
        </div>
      </div>
    </>
  )
}

export default function ContenidoPropuestas() {
  return (
    <>
      <LineasModulo />
      {/* <FormatosModulo /> */}
      <Tecnologias />
    </>
  )
}
