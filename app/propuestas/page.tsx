
import BtnSketchy from '@/components/custom/ld-btn-sketchy'
import { titulo as fuenteTitulo } from '@/components/fonts'
import { LogoTec } from '@/components/ui/logotec'
import { Waypoints } from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'
import NextLink from 'next/link'
import { ComponentProps } from 'react'

const Link = (props: ComponentProps<typeof NextLink>) => (
  <NextLink
    className="bg-gradient-to-r from-cyan-500 to-violet-500 
    text-transparent bg-clip-text underline decoration-double 
    hover:border-b hover:border-b-4 border-violet-500"
    {...props}
  />
)
  
export const metadata: Metadata = {
  title: 'Propuestas',
}

interface FormatosProps {
  formato: string
  descripcion: string
}

const Formatos = ({ formato, descripcion }: FormatosProps) => {
  return (
    <div
      data-aos="fade-left"
      data-aos-duration="2000"
      data-aos-delay="100"
      className="border-2 border-[#06b6d4] border-solid h-full p-4 rounded-xl "
    >
      <h1 className="flex text-xl lg:text-2xl font-bold place-content-center my-4 text-center text-[rgb(6,182,212)] drop-shadow-lg">
        <Waypoints className="w-20" />
        {formato}
        <Waypoints className="w-20" />
      </h1>
      <p className="m-2 text-[1rem] lg:text-lg">{descripcion}</p>
    </div>
  )
}

const FormatosModulo = () => {
  return (
    <div className="lg:mt-20 lg:mx-15 flex flex-col items-center text-center rounded-xl lg:pt-10">
      <h2 className="text-center font-bold text-xl lg:text-3xl w-fit px-10 rounded-x bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text">
        Las propuestas se ofrecen en formato seminario, taller y clases particulares
      </h2>

      <div className="bg-white flex flex-col lg:grid lg:grid-cols-3 gap-4 place-content-between m-10 lg:m-20">
        <Formatos
          formato="Seminario"
          descripcion='Son instancias de una o dos clases intensivas y largas en las que vemos de manera introductoria algún tema
            puntual. Es ideal para almas autodidactas que pueden aprovechar una buena rampa de entrada a un tema que
            les evite el famoso "infierno de tutoriales".'
        />

        <Formatos
          formato="Talleres"
          descripcion=" Son instancias largas, recurrentes, orientadas alrededor de una línea de desarrollo de proyectos. Es ideal
            para almas aplicadas, que disfruten el trabajo en equipo, y la buena cosecha que sigue a una buena
            siembra."
        />
        <Formatos
          formato="Clases Particulares"
          descripcion="Son para vos si sabés lo querés y vas con toda en esa dirección, o si apreciás el fruto de un trabajo
            sostenido y preferís el mentoreo individual."
        />
      </div>
    </div>
  )
}

interface LineasProps {
  titulo: string
  descripcion: string
  lista: string[]
  btn: JSX.Element
  imagen: JSX.Element
}

const Lineas = ({ titulo, descripcion, imagen, lista, btn }: LineasProps) => {
  return (
    <div
      className="flex flex-col lg:flex-row w-fit mx-4 lg:w-[800px] m-4 lg:m-10 border-2 p-4 lg:px-10 border-dashed border-black rounded-xl items-center lg:gap-8"
      data-aos="fade-up"
      data-aos-duration="1000"
    >
      <h1
        className={`${fuenteTitulo.className} bg-gradient-to-b from-cyan-500 to-violet-500 text-transparent bg-clip-text drop-shadow-lg text-4xl lg:text-7xl lg:w-fit font-bold lg:[writing-mode:vertical-rl] lg:[text-orientation:upright]`}
      >
        {titulo}{' '}
      </h1>

      <div className="flex bg-white/80 flex-col lg:py-10 lg:gap-4  rounded-xl">
        <div className="flex flex-col items-center lg:p-5 lg:gap-4">
          <h3 className="text-[1rem] lg:text-2xl m-4 text-center font-semibold text-[#06b6d4]">{descripcion}</h3>

          {imagen}
        </div>
        <ul className="flex flex-col font-bold text-center gap-4 p-4 lg:px-10 text-[1rem] lg:text-lg">
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
    <div className="flex flex-col m-4 lg:m-10 lg:px-20 lg:mx-20 items-center justify-center ">
      <div className="p-4 text-center lg:px-10 bg-white rounded-xl text-[1rem] lg:text-2xl lg:mx-32">
        <h2
          data-aos="fade-left"
          className={`${fuenteTitulo.className} text-4xl bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text drop-shadow-lg lg:text-7xl`}
        >
          Líneas de contenido
        </h2>
        <p className="m-4">
          {' '}
          Hemos buscado desarrollar un esquema que nos permita ofrecer{' '}
          <span className="font-bold text-[#06b6d4]">oportunidades de formación para todo el mundo.</span>{' '}
        </p>
        <p className="m-4">
          <span className="font-bold text-[#06b6d4]">La clave está en la flexibilidad</span> debida a{' '}
          <Link
            href="/identidad"
          >
            nuestras necesidades identitarias
          </Link>
          . En los talleres, los estudiantes más avanzados enseñan a los más nuevos, y así practican también la
          didáctica. El material generado durante las clases particulares se pone a disposición como recursos para que
          sirva a autodidactas y otrxs profes. En los seminarios directamente se dispensa formación técnica a chorro. En
          el blog se escribe sobre pedagogía y enseñanza al público más maduro. Ludilabs, nuestro estudio anexo, ofrece
          campo para el desempeño profesional. Aún a personas a las que no tengamos nada que enseñarles, les damos la
          bienvenida para así aprender de ellas.
        </p>
        <Link href='https://instagram.com/ludidactas' >¡Consultanos!</Link>
      </div>

      <Lineas
        titulo="TÉCNICA"
        descripcion="Aprendemos mediante la experiencia en grupo, bajo 
        la premisa de que lxs alumnxs puedan tener la oportunidad para guiar a lxs otrxs y 
        poner en práctica lo aprendido. Así para cualquier nivel hay alguien a quien nutre ese encuentro. 
        Los espacios técnicos funcionan mejor con contribución estable y compromiso a largo plazo"
        lista={[
          'Formación grupal, abierta a todo público.',
          'Talleres, cursos y seminarios orientados a la transmisión de conocimientos técnicos en las áreas de programación, animación, desarrollo de videojuegos y otras tecnologías y herramientas asociadas',
          'Estructura modular. Los módulos siguen líneas, temas y relaciones. Así mismo, varios módulos pueden llegar a aparecer en un solo taller o encontrarse reiterados en varios talleres. No todas las correlatividades son difíciles.',
        ]}
        btn={
          <BtnSketchy className="block text-xl h-[64px] leading-[44px] self-center" href={''} disabled>
            Proximamente
          </BtnSketchy>
        }
        imagen={
          <Image
            className="w-fit h-fit self-center rounded-full"
            src="/img/grupopixel.jpeg"
            alt=""
            width={150}
            height={150}
          />
        }
      />

      <Lineas
        titulo="DIDÁCTICA"
        descripcion="En la línea Didáctica nos enfocamos en el proceso de transmisión:  el cómo y las condiciones para enseñar o instruir"
        lista={[
          'Linea de contenido dirigida a talleristas, docentes o personas que estén interesadas en la enseñanza de estas tecnologías y en el desarrollo de las actividades y los materiales que les son propios tales como rutas de aprendizaje, guías de ejercicios, trabajos prácticos, etc.',
          'Las distintas modalidades se encuentran orientadas hacia poner en práctica las tecnologías y herramientas aprendidas en la etapa técnica',
        ]}
        btn={
          <BtnSketchy className="block text-xl h-[64px] leading-[44px] self-center" href="/convocatoria">
            Convocatoria
          </BtnSketchy>
        }
        imagen={
          <Image
            className="w-fit h-fit self-center rounded-full"
            src="/img/grupopixel2.jpeg"
            alt=""
            height={150}
            width={150}
          />
        }
      />

      <Lineas
        titulo="PEDAGÓGICA"
        descripcion="En la línea pedagógica exploramos la relación humana con el proceso educativo. ¿Qué hace allí el docente? ¿Desde dónde se para? ¿Cómo decide qué va a mostrar? ¿Qué muestra -es decir, enseña- con su actutid, sus acciones, su forma de estar? ¿Cuál es el proyecto político y cultural que incorpora?"
        lista={[
          'Orientada a la comunidad educativa en general, principalmente a personas que se implique en el aspecto regenerativo/reflexivo del proyecto.',
          'Expresada en encuentros, charlas, conversatorios y escritos',
        ]}
        btn={
          <BtnSketchy
            className="block text-xl h-[64px] leading-[44px] self-center"
            href="https://ludidactas.medium.com/"
          >
            Ver blog
          </BtnSketchy>
        }
        imagen={
          <Image
            className="w-fit h-fit self-center rounded-full"
            src="/img/grupopixel2.jpeg"
            alt=""
            height={150}
            width={150}
          />
        }
      />
    </div>
  )
}


const Tecnologias = () => {
  return (
    <div className="mx-8 lg:m-20 rounded-xl bg-slate-100/50">
      <h1
        data-aos="fade-left"
        className={`${fuenteTitulo.className} m-4 lg:m-10 pt-10 drop-shadow-lg text-4xl text-center lg:text-7xl bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text`}
      >
        Tecnologías
      </h1>
      <p className=" font-bold text-center lg:p-8 mx-4 text-[1rem] lg:text-3xl ">
        Todas las propuestas se encuentran dirigidas a cualquier persona que busque formarse en cada una de las líneas
        de contenido y -en el caso de la línea técnica- en cada una de las{' '}
        <span className="font-bold text-cyan-500">tecnologías con las que trabajamos.</span>
      </p>

      <div className="grid grid-cols-3 gap-[40px] p-10 lg:p-20 place-items-center ">
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
      <LineasModulo />
      <FormatosModulo />
      <Tecnologias />
    </>
  )
}
