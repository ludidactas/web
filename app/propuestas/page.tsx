import { Pixelify, Jersey } from '@/components/fonts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import Image from 'next/image'

const LogoTec = ({ nombre, url, descripcion }: { nombre: string; url: string; descripcion: string }) => {
  return (
    <TooltipProvider delayDuration={100}>
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
  )
}

const Formatos = () => {
  return (
    <div className="mt-20 mx-20">
      <h1 className="text-3xl">En Ludidactas hemos diseñado 3 propuestas o lineas de contenido principales:</h1>

      <h1 className={`${Pixelify.className} my-5 text-4xl text-[#4198AA]`}>técnica, didáctica y pedagógica.</h1>
      <div className="flex flex-col items-center rounded-xl pt-10">
        <h2 className="text-center text-3xl bg-slate-200 w-fit p-10 rounded-xl">
          Las propuestas se ofrecen en formato seminario, taller y clases particulares:
        </h2>
        <div className="grid grid-cols-3 gap-4 m-20">
          <div
            data-aos="fade-left"
            data-aos-duration="2000"
            data-aos-delay="100"
            className="bg-slate-200 h-full p-4 rounded-xl items-center justify-center"
          >
            <span className="circle"></span>
            <p className="text-3xl text-center text-[#46BFD7] drop-shadow-lg m-4">Seminarios</p>
            <p className="m-2">
              Son instancias de una o dos clases intensivas y largas en las que vemos de manera introductoria algún tema
              puntual. Es ideal para almas autodidactas que pueden aprovechar una buena rampa de entrada a un tema que
              les evite el famoso &quot;infierno de tutoriales&quot;.
            </p>
          </div>

          <div
            data-aos="fade-left"
            data-aos-duration="2000"
            data-aos-delay="200"
            className="bg-slate-200 p-4 h-full rounded-xl items-center "
          >
            <span className="circle"></span>
            <p className="text-3xl text-center text-[#46BFD7] drop-shadow-lg m-4">Talleres</p>
            <p className="m-2">
              Son instancias largas, recurrentes, orientadas alrededor de una línea de desarrollo de proyectos. Es ideal
              para almas aplicadas, que disfruten el trabajo en equipo, y la buena cosecha que sigue a una buena
              siembra.
            </p>
          </div>
          <div
            data-aos="fade-left"
            data-aos-duration="2000"
            data-aos-delay="300"
            className="bg-slate-200 h-full p-4 rounded-xl"
          >
            <span className="circle"></span>
            <p className="text-3xl text-center text-[#46BFD7] drop-shadow-lg m-4">Clases Particulares</p>
            Son para vos si sabés lo querés y vas con toda en esa dirección, o si apreciás el fruto de un trabajo
            sostenido y preferís el mentoreo individual.
          </div>
        </div>
      </div>
    </div>
  )
}

const Lineas = () => {
  return (
    <div className="m-20">
      <div className="bg-slate-200 p-10">
        <h1 data-aos="fade-left" className={`${Jersey.className} m-10 pt-10 drop-shadow-lg text-7xl`}>
          Líneas de contenido
        </h1>
        <p>
          {' '}
          Hemos desarrollado un esquema que nos permite ofrecer oportunidades de formación para todos los niveles de
          aprendizaje, en módulos cortos y autoconclusivos. Los módulos propuestos se corresponden con determinados
          temas y relaciones. Así mismo, varios módulos pueden llegar a aparecer en un solo taller o encontrarse
          reiterados en varios talleres. No todas las correlatividades son difíciles. ¡Consultanos!
        </p>
      </div>
    </div>
  )
}
const Tecnologias = () => {
  return (
    <div>
      <h1 className="p-8 mx-4 text-3xl rounded-xl bg-slate-300/50">
        Todas las propuestas se encuentran dirigidas tanto a personas pertenecientes al ámbito educativo, como a un
        público general, que busquen formarse en cada una de las líneas de contenido y de las{' '}
        <span className="font-bold">tecnologías asociadas a ellas.</span>
      </h1>

      <div className="text-center">
        <h1 data-aos="fade-left" className={`${Jersey.className} m-10 pt-10 drop-shadow-lg text-7xl`}>
          Tecnologías
        </h1>
        <div className=" grid grid-cols-3 gap-[40px]  p-20 place-items-center ">
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
    </div>
  )
}
export default function Page() {
  return (
    <>
      <Formatos />
      <Lineas />
      <Tecnologias />
    </>
  )

  //     <div className="modulo" data-aos="fade-up">
  //         <div className="subtitle">
  //             ![Técnica](/img/tecnica.png)
  //         </div>
  //         <div>
  //             ### Aprendemos mediante la experiencia en grupo, bajo la premisa de que lxs alumnxs puedan recibir a quienes lleguen y tener la oportunidad para guiar a lxs otrxs y poner en práctica lo aprendido. Así para cualquier nivel hay alguien a quien nutre ese encuentro. Los espacios técnicos funcionan mejor con contribución estable y compromiso a largo plazo.

  //             - Formación grupal, abierta a todo público.

  //             - Talleres, cursos y seminarios orientados a la transmisión de conocimientos técnicos en las áreas de programación, animación, desarrollo de videojuegos y otras tecnologías y herramientas asociadas.

  //             <button className="custom-btn btn-15"> Ver propuestas técnicas</button>
  //         </div>

  //     </div>

  //     <div className="modulo" data-aos="fade-up">
  //         <div className="subtitle ">
  //             ![Didáctica](/img/didactica.png)
  //         </div>
  //         <div>
  //             ### En la línea Didáctica nos enfocamos en el proceso de transmisión:  el cómo y las condiciones para enseñar o instruir

  //             -  Linea de contenido dirigida a docentes o personas que estén interesadas en la enseñanza de estas tecnologías y en el desarrollo propio de los medios asociados tales como la elaboración de rutas de aprendizaje, la eleccion y el desarrollo de las modalidades y las herramientas necesarias.

  //             -  Las distintas modalidades se encuentran orientadas hacia poner en práctica las tecnologías y herramientas aprendidas en la etapa técnica

  //             <button className="custom-btn btn-15">Ver propuestas didácticas</button>
  //         </div>
  //     </div>

  //     <div className="modulo" data-aos="fade-up">
  //         <div className="subtitle ">
  //             ![Pedagógica](/img/pedagogica.png)
  //         </div>
  //         <div>
  //             - Línea de contenido orientada a docentes.
  //             - Talleres, cursos y seminarios

  //             <button className="custom-btn btn-15">Ver propuestas pedagógicas</button>
  //         </div>
  //     </div>

  // </div>
}
