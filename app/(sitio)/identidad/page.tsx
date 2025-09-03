import Image from 'next/image'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/ld-carousel'
import { titulo as fuenteTitulo } from '@/components/fonts'
import WithAOS from '@/components/ui/with-aos'
import { ComponentProps, PropsWithChildren } from 'react'
import { Metadata } from 'next'
import { Hl } from '../inicio/highlight'
import { cn } from '@/lib/utils'
import SvgEscritorio from '@/svg/escritorio'
import SvgPibis from '@/svg/pibis'
import PjCarousel from '@/svg/pjCarousel'

export const metadata: Metadata = {
  title: 'Identidad',
}

export default function Page() {
  const styletitle = '${fuenteTitulo.className} m-4 md:m-10 drop-shadow-[2px_2px_2px_rgba(0,0,0)] bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-4xl md:text-7xl'
  const stylediv = 'w-[90vw] max-w-[1080px] pb-12 md:text-[1.6rem] space-y-4'
  return (
    <WithAOS>
      <div className="w-screen flex flex-col items-center gap-4">

        {/* Vision */}
        <div className={`${stylediv} text-center`}>
          <h1
            data-aos="fade-left"
            className={`${styletitle}`}
          >
            La visión
          </h1>
          {/* Primeros párrafos */}
          <p>
            La visión del proyecto es la formación de un motor pedagógico para el{' '}
            <span className="text-[#8b5cf6] font-bold">crecimiento regenerativo de la educación, orgánico y
              comunitario, con amor por la enseñanza, la técnica y la educación.</span> De la mano con la comprensión,
            distinguiendo fines y medios.
          </p>
          <p>
            A medida que nos vamos encontrando y reconociendo, esta visión se concretiza en{' '}
            <span className="text-[#46BFD7] font-bold">
              talleres, ciclos de formación, conversaciones, producción de material de referencia, publicaciones
            </span>{' '}
            y demás formas de encuentro.
          </p>
          <p>
            La propuesta pedagógica gira alrededor de{' '}
            <span className="text-[#46BFD7] font-bold">la práctica y la técnica para el juego</span>, quitando el foco
            de la utilidad, la deriva, la ganancia. Y configura los medios de manera que que haya lugar para todo el
            mundo, para un crecimiento rizomático, nodal, sostenible.
          </p>
        </div>

        {/* Foto */}
        <div className="flex justify-center border-solid">
          <Image
            className="text-center shadow-4xl rounded-xl "
            data-aos="zoom-in-down"
            src={'/img/Identidad1.png'}
            alt={'Grupo taller Ludidactas'}
            width={1000}
            height={1000}
          ></Image>
        </div>
      </div>
      <div className='bg-indigo-200/20 mt-20 w-screen flex flex-col items-center gap-4'>

        {/* Equipo */}
        <div className={`${stylediv}`}>

          <h1
            data-aos="fade-left"
            className={`${styletitle} text-center`}
          >
            El equipo
          </h1>

          <div className='flex flex-col gap-8'>
            <div className='relative'>
              <Image data-aos="flip-left"
                data-aos-duration='2000'
                className='rounded-full float-left mr-6 [shape-outside:circle(50%)] [shape-margin:0.05rem]'
                src={'/img/avatar.png'}
                height={200}
                width={200}
                alt='' />
              <p className='text-justify leading-relaxed'>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellat at,
                accusantium veniam nesciunt tempore eos aperiam laboriosam exercitationem
                assumenda aliquam saepe unde iusto. Voluptatum numquam porro dolorum cupiditate, dolor eaque.</p>
              <div className='clear-left'></div>
            </div>
            <div className='relative'>
              <Image data-aos="flip-left"
                data-aos-duration='2000'
                className='rounded-full float-right ml-6 [shape-outside:circle(50%)] '
                src={'/img/avatar.png'}
                height={200}
                width={200}
                alt='Team member 2'
              />
              <p className='text-justify leading-relaxed'>
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellat at,
                accusantium veniam nesciunt tempore eos aperiam laboriosam exercitationem
                assumenda aliquam saepe unde iusto. Voluptatum numquam porro dolorum
                cupiditate, dolor eaque.
              </p>
              <div className='clear-right'></div>
            </div>

          </div>
        </div>
      </div>

      {/* El hoy */}

      <div className="mt-10 lg:mt-20">
        <div className={`${stylediv} text-center`}>

          <h1
            data-aos="fade-left"
            className={`${styletitle}`}
          >
            El hoy
          </h1>

          <p>Nos reconocemos en una época que pide regeneración.</p>
          <p>
            La <Hl>disociación entre diferentes áreas y estadíos de la educación</Hl> a través una
            compartimentalización que sirve a la rentabilidad o masificación y no a la enseñanza, facilitó que hoy
            confundamos educación con instrucción, estudio con práctica y certificación con realización.
          </p>
          <p>
            Queremos sembrar otro tipo de espacio educativo, centrado en la práctica y el grupo, flexible por
            diseño, donde el proceso educativo mismo sea al menos tan importante como su resultado.
          </p>
        </div>
      </div>

      {/* Seccion carousel  */}
      <div className='bg-orange-100/30 mt-20 w-screen flex flex-col items-center gap-4'>
        <div className="flex flex-col w-[80vw] text-center lg:grid lg:grid-cols-2 justify-items-center lg:m-10 justify-center items-center ">
          <h1
            data-aos="fade-left"
            className={`${fuenteTitulo.className} mb-4 lg:m-10 drop-shadow-lg bg-cyan-600 text-transparent bg-clip-text text-2xl md:text-4xl lg:text-5xl`}
          >
            Es por ello que resulta necesario abordar los procesos de enseñanza y aprendizaje desde una perspectiva
            que nos permita:
          </h1>

          {/* Carousel de personajes */}
          <Carousel className="w-[70vw] mx-4 lg:w-[400px] lg:ml-10">
            <CarouselContent>
              <CarouselItem>
                <PjCarousel personaje="biclope">
                  <p className="text-3xl">
                    El <span className="text-cyan-500">diálogo e integración</span> entre diversas áreas y
                    &quot;niveles&quot; de la educación. ¡El proceso de enseñanza-aprendizaje es un único fenómeno!
                  </p>
                </PjCarousel>
              </CarouselItem>
              <CarouselItem>
                <PjCarousel personaje="ojito">
                  <p className="text-3xl">
                    Comprender que las condiciones para el aprendizaje no están dadas por procedimientos mecánicos
                    sino por un proceso vivo, con{' '}
                    <span className="text-cyan-500">el juego como motor organizador</span>
                  </p>
                </PjCarousel>
              </CarouselItem>
              <CarouselItem>
                <PjCarousel personaje="pulpo">
                  <p className="text-3xl">
                    Desarrollar <span className="text-cyan-500">procesos educativos flexibles</span> que nos
                    permitan recibir y armonizar la diversidad de individualidades en el aula, taller o sala,
                    adaptándonos a diferentes necesidades y estilos de aprendizaje.
                  </p>
                </PjCarousel>
              </CarouselItem>
              <CarouselItem>
                <PjCarousel personaje="robot">
                  <p className="text-3xl">
                    La formación en el <span className="text-cyan-500">uso creativo</span> de tecnologías
                    contemporáneas, lo que hace a la diferencia entre usuario y consumidor.
                  </p>
                </PjCarousel>
              </CarouselItem>
            </CarouselContent>

            <CarouselPrevious className="bg-[#1e1e1e] flex items-center justify-center text-white dark:bg-white" />
            <CarouselNext className="bg-[#1e1e1e] flex items-center justify-center text-white dark:bg-white" />
          </Carousel>
        </div>
      </div>

      {/* Párrafo en tarjeta "Entendemos el juego como germen de la educación y de la creatividad..." */}
      <div data-aos="fade-up"
        data-aos-duration="2000"

        className={`${stylediv} p-16 my-20 text-center rounded-xl`}>
        <p>
          Entendemos{' '}
          <span className="text-[#46BFD7] font-bold lg:text-2xl">
            el juego como germen de la educación y de la creatividad
          </span>
          , que ocurre en la naturaleza espontánea y consistentemente{' '}
          <span className="text-[#46BFD7] font-bold lg:text-2xl">con un rol didáctico:</span> cada especie juega como
          le va a ser propio trabajar en su edad adulta. Y juego es también el proceso de ensayo y
          autoperfeccionamiento: la actitud del ajedrecista, de la artista marcial, de un músico, de una gimnasta, que
          practica, ensaya y estudia, a fin de cuentas, para la partida, el enfrentamiento, la improvisación o la
          performarce.{' '}
        </p>
        <p className="text-[#8b5cf6] font-bold text-2xl pt-6">
          El juego nos impulsa a la investigación, a aprender a aprender, independientemente de la forma que tome. Nos
          muestra horizontes, que reclaman caminos.
        </p>
      </div>

      {/* Secciones con titulo + dibujo + texto */}
      <div className='bg-violet-100/50 mt-10 w-screen flex flex-col items-center gap-4'>

        <TituloYDosColumnas titulo="Con la motivación correcta el aprendizaje se da de una forma orgánica.">
          <>
            <SvgEscritorio />
            <P>
              Una educación al servicio de las exigencias de la rentabilidad no podrá dejar nunca de comparar y
              cuantificar, ni de organizar el deber en función de metas y expectativas preestablecidas, con la ansiedad
              que inevitablemente entraña. Educar en función de la empleabilidad tiene su lugar, pero no puede ser todos
              los lugares. Cuando se practica y se investiga por visión, y no por imposición, es que{' '}
              <span className="text-[#46BFD7] font-bold">
                el verdadero aprendizaje tiene lugar, el que se siente como descubrir, no como adquirir
              </span>
            </P>
          </>
        </TituloYDosColumnas>

        <TituloYDosColumnas titulo="Tomamos la forma que tome nuestra comunidad" invertido>
          <SvgPibis />
          <P>
            Enseñamos, en principio,{' '}
            <span className="text-[#46BFD7] font-bold">
              programación, matemática, ilustración digital y otras técnicas cercanas al desarrollo de videojuegos{' '}
            </span>
            , porque es el ámbito y contexto concreto donde el proyecto se originó. Pero esperamos eventualmente dar la
            bienvenida a talleres de música, circo, ciencias, huerta y más. Enseñamos computación, sistemas e
            informática como campos del conocimiento creativo, no como instrumentos de lucro, provecho y rendimiento.
          </P>
        </TituloYDosColumnas>
      </div>

      {/* Pie */}
      {/* <div className="w-[90vw] md:w-[60vw] max-w-[1080px] flex flex-col gap-4 my-4"> */}
      <div className={`${stylediv} text-center bg-white/80 mt-20 text-4xl`}>
        <p className="p-0 md:p-10 text-[1.2rem] md:text-[1.4rem]">
          {' '}
          Desde Ludidactas, <span className="text-[#8b5cf6] font-bold text-2xl pt-6">buscamos acometer esta labor desde una perspectiva lúdica y didáctica </span> (de allí nuestro
          nombre), pues creemos que atendiendo al proceso didáctico-pedagógico podemos regenerar el tejido creativo.
        </p>
        <p className="md:px-10 pb-20 text-[1.2rem] md:text-[1.4rem]">
          Para nosotros es importante cultivar la capacidad de hacer, no mediante procedimientos mecánicos, sino
          mediante <span className="text-[#46BFD7]">el juego</span> como via para enseñar con mayor inmunidad a{' '}
          <span className="text-[#46BFD7]">los síntomas de la repetición inadvertida</span>.
        </p>
      </div>
    </WithAOS>
  )
}

interface TituloYDosColumnasProps extends PropsWithChildren {
  titulo: string
  invertido?: boolean
}

/**
 * Abstrae el layout en columnas que usamos en la última parte de la página
 */
const TituloYDosColumnas = ({ titulo, children, invertido = false }: TituloYDosColumnasProps) => (
  <div className="flex flex-col mx-4 md:mx-20 max-w-[1480px]">
    <h1
      data-aos="fade-left"
      className={`${fuenteTitulo.className} text-center my-8 lg:m-20 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-4xl lg:text-5xl`}
    >
      {titulo}
    </h1>

    <div
      className="flex flex-col lg:grid lg:grid-cols-2 lg:grid-rows-none gap-4 items-center justify-items-center"
      style={invertido ? { direction: 'rtl' } : {}}
    >
      {children}
    </div>
  </div>
)

const P = ({ children, className }: ComponentProps<'p'>) => (
  <p
    data-aos="fade-up"
    data-aos-duration="500"
    className={cn('lg:text-2xl lg:m-5 p-10 border-8 border-dashed border-indigo-200 rounded-xl', className)}
  >
    {children}
  </p>
)
