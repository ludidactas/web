import Image from 'next/image'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/ld-carousel'
import { titulo } from '@/components/fonts'
import WithAOS from '@/components/ui/with-aos'
import { PropsWithChildren } from 'react'
import { Metadata } from 'next'

function SpeechBubble({ children }: PropsWithChildren) {
  return (
    <div className="flex items-center justify-center m-4 rounded-lg bg-gray-100">
      <div className="relative bg-white text-black text-[1rem] font-bold p-4 rounded-lg shadow-lg max-w-xs">
        {children}
        <div className="absolute right-25 -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-20 border-r-transparent border-t-8 border-t-white"></div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Identidad',
}


export default function Page() {
  return (
    <WithAOS>
      <div className="flex flex-col items-center text-center">
        <h1
          data-aos="fade-left"
          className={`${titulo.className} m-10 drop-shadow-[2px_2px_2px_rgba(0,0,0)] bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-7xl`}
        >
          La visión
        </h1>

        <div className="mx-20 pb-12 text-[1.6rem] space-y-4">
          <p>
            La visión del proyecto es la formación de un motor pedagógico para el{' '}
            <span className="text-[#46BFD7] font-bold">crecimiento regenerativo de la educación</span>. Orgánico.
            Comunitario. Con amor por la enseñanza, la técnica y la educación. De la mano con la comprensión,
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

        <div className="mt-10 md:mt-20">
          <h1
            data-aos="fade-left"
            className={`${titulo.className} m-4 md:m-10 drop-shadow-[2px_2px_2px_rgba(0,0,0)] bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-5xl md:text-7xl`}
          >
            El hoy
          </h1>

          <div className="flex flex-col text-center mx-4 md:mx-20 p-2">
            <p className="text-xl md:text-[1.4rem] md:m-10 p-10 f bg-white border-4 border-black border-dashed rounded-xl mb-10">
              Uno de los desafíos que se nos presenta a los educadores en la actualidad es la{' '}
              <span className="text-[#46BFD7] font-bold">
                creciente disociación entre diferentes áreas de la enseñanza
              </span>{' '}
              en todos los niveles educativos. Sumado a esto, actualmente experienciamos una{' '}
              <span className="font-bold text-[#46BFD7]">
                progresiva influencia de la tecnología en todas las áreas del conocimiento y esferas sociales.
              </span>{' '}
            </p>

            <div className="flex flex-col m-4 md:grid md:grid-cols-2  md:m-10 justify-center items-center ">
              <h1
                data-aos="fade-left"
                className={`${titulo.className} mb-4 md:m-10 drop-shadow-lg bg-cyan-600 text-transparent bg-clip-text text-4xl md:text-5xl`}
              >
                Es por ello que resulta necesario abordar los procesos de enseñanza y aprendizaje desde una perspectiva
                que nos permita:
              </h1>


              <Carousel className="w-[60vw] mx-4 md:w-[400px] md:ml-10">
                <CarouselContent>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xs md:text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
                    <SpeechBubble>
                      La formación en el <span className="text-cyan-500">uso creativo</span> de tecnologías
                      contemporáneas, lo que hace a la diferencia entre usuario y consumidor.
                    </SpeechBubble>
                    <Image
                      className="m-6 p-2  bg-white rounded-xl"
                      src={'/img/Pixel1.png'}
                      alt={''}
                      width={200}
                      height={200}
                    ></Image>
                  </CarouselItem>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xs md:text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
                    <SpeechBubble>
                      El <span className="text-cyan-500">diálogo e integración</span> entre diversas áreas y
                      &quot;niveles&quot; de la educación. ¡El proceso de enseñanza-aprendizaje es un único fenómeno!
                    </SpeechBubble>
                    <Image
                      className="m-6 p-2  bg-white rounded-xl"
                      src={'/img/Pixel2.png'}
                      alt={''}
                      width={200}
                      height={200}
                    ></Image>
                  </CarouselItem>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
                    <SpeechBubble>
                      Comprender que las condiciones para el aprendizaje no están dadas por procedimientos mecánicos
                      sino por un proceso vivo, con{' '}
                      <span className="text-cyan-500">el juego como motor organizador</span>
                    </SpeechBubble>
                    <Image
                      className="m-6 p-2  bg-white rounded-xl"
                      src={'/img/Pixel3.png'}
                      alt={''}
                      width={200}
                      height={200}
                    ></Image>
                  </CarouselItem>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
                    <SpeechBubble>
                      Desarrollar <span className="text-cyan-500">procesos educativos flexibles</span> que nos permitan
                      recibir y armonizar la diversidad de individualidades en el aula, taller o sala, adaptándonos a
                      diferentes necesidades y estilos de aprendizaje.
                    </SpeechBubble>
                    <Image
                      className="m-6 p-2  bg-white rounded-xl"
                      src={'/img/Pixel4.png'}
                      alt={''}
                      width={200}
                      height={200}
                    ></Image>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="bg-[#1e1e1e] flex items-center justify-center text-white dark:bg-white" />
                <CarouselNext className="bg-[#1e1e1e] flex items-center justify-center text-white dark:bg-white" />
              </Carousel>
            </div>
          </div>
        </div>

        <div className="text-xl m-4 md:text-[1.4rem] md:mx-10 md:p-10 bg-sky-200/30 rounded-xl">
          <p>
            Entendemos{' '}
            <span className="text-[#46BFD7] font-bold md:text-2xl">
              el juego como germen de la educación y de la creatividad
            </span>
            , que ocurre en la naturaleza espontánea y consistentemente{' '}
            <span className="text-[#46BFD7] font-bold md:text-2xl">con un rol didáctico:</span> cada especie juega como
            le va a ser propio trabajar en su edad adulta. Y juego es también el proceso de ensayo y
            autoperfeccionamiento: la actitud del ajedrecista, de la artista marcial, de un músico, de una gimnasta,
            que practica, ensaya y estudia, a fin de cuentas, para la partida, el enfrentamiento, la improvisación o
            la performarce.{' '}
          </p>
          <p className="text-[#8b5cf6] font-bold text-2xl pt-6">
            El juego nos impulsa a la investigación, a aprender a aprender, independientemente de la forma que tome.
            Nos muestra horizontes, que reclaman caminos.
          </p>
        </div>

        <div className='flex flex-col mx-20'>
          <h1
            data-aos="fade-left"
            className={`${titulo.className} m-20 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-4xl md:text-5xl`}
          >
            {' '}
            Con la motivación correcta el aprendizaje se da de una forma orgánica.
          </h1>

          <div className="md:grid md:grid-cols-2 w-[80vw] gap-8 items-center self-center">
            <Image
              className="shadow-2xl m-5 rounded-xl"
              data-aos="fade-left"
              src={'/img/Identidad2.JPG'}
              alt={'Grupo taller Ludidactas'}
              width={600}
              height={600}
            ></Image>

            <p
              data-aos="fade-up"
              data-aos-duration="500"
              className="text-2xl m-5 p-10 bg-white/50 border-4 border-dashed border-black rounded-xl"
            >
              Una educación al servicio de la productividad mercantilista no podrá dejar nunca de comparar y
              cuantificar, ni de organizar el deber en función de metas y expectativas preestablecidas, con la
              ansiedad que inevitablemente entraña. Educar en función de la empleabilidad tiene su lugar, pero no
              puede ser todos los lugares. Cuando se practica y se investiga por visión, y no por imposición, es que{' '}
              <span className="text-[#46BFD7] font-bold">
                el verdadero aprendizaje tiene lugar, el que se siente como descubrir, no como adquirir
              </span>
            </p>
          </div>
        </div>

        <div className='flex flex-col mx-20'>
          <h1
            data-aos="fade-left"
            className={`${titulo.className} m-20 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-4xl md:text-5xl`}
          >
            Tomamos la forma que tome nuestra comunidad
          </h1>
          <div className="md:grid md:grid-cols-2 w-[80vw] gap-8 items-center">

            <p
              data-aos="fade-up"
              data-aos-duration="500"
              className="text-2xl m-5 p-10 bg-white/50 border-4 border-dashed border-black rounded-xl"
            >
              Enseñamos, en principio,
              <span className="text-[#46BFD7] font-bold">
                {' '}
                programación, matemática, ilustración digital y otras técnicas cercanas al desarrollo de videojuegos{' '}
              </span>
              , porque es el ámbito y contexto concreto donde el proyecto se originó. Pero esperamos eventualmente dar
              la bienvenida a talleres de música, circo, ciencias, huerta y más. Enseñamos computación, sistemas e
              informática como campos del conocimiento creativo, no como instrumentos de lucro, provecho y
              rendimiento.
            </p>

            <Image
              className="shadow-2xl m-5 rounded-xl"
              data-aos="fade-right"
              src={'/img/Identidad3.png'}
              alt={'Taller Ludidactas 2'}
              width={1000}
              height={1000}
            ></Image>
          </div>
        </div>

        <p className="p-10 w-[60vw] text-[1.4rem] ">
          {' '}
          Desde Ludidactas, buscamos acometer esta labor desde una perspectiva lúdica y didáctica (de allí nuestro
          nombre), pues creemos que atendiendo al proceso didáctico-pedagógico podemos regenerar el tejido creativo.</p>
        <p className="px-10 w-[60vw] pb-20 text-[1.4rem]">Para nosotros es importante cultivar la capacidad de hacer, no mediante procedimientos mecánicos, sino
          mediante <span className="text-[#46BFD7]">el juego</span> como via para enseñar con mayor inmunidad a{' '}
          <span className="text-[#46BFD7]">los síntomas de la repetición inadvertida</span>.
        </p>
      </div>


    </WithAOS >
  )
}

