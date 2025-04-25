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

const IdDesktop = () => {
  return (
    <WithAOS>
      <div className="hidden lg:flex text-center flex-col items-center">
        <h1
          data-aos="fade-left"
          className={`${titulo.className} m-10 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-7xl`}
        >
          La visión
        </h1>

        <div className="w-3/5 pb-12">
          <p className="text-[1.6rem] m-4">
            La visión del proyecto es la formación de un motor pedagógico para el{' '}
            <span className="text-[#46BFD7] font-bold">crecimiento regenerativo de la educación</span>. Orgánico.
            Comunitario. Con amor por la enseñanza, la técnica y la educación. De la mano con la comprensión,
            distinguiendo fines y medios.
          </p>
          <p className="text-[1.6rem] m-4">
            A medida que nos vamos encontrando y reconociendo, esta visión se concretiza en{' '}
            <span className="text-[#46BFD7] font-bold">
              talleres, ciclos de formación, conversaciones, producción de material de referencia, publicaciones
            </span>{' '}
            y demás formas de encuentro.
          </p>
          <p className="text-[1.6rem] m-4">
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

        <div className="mt-20">
          <h1
            data-aos="fade-left"
            className={`${titulo.className} m-10 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-7xl`}
          >
            El hoy
          </h1>

          <div className="flex flex-col text-center  mx-20 p-2">
            <p className="text-[1.4rem] m-10 p-10 f bg-white border-4 border-black border-dashed rounded-xl mb-10">
              Uno de los desafíos que se nos presenta a los educadores en la actualidad es la{' '}
              <span className="text-[#46BFD7] font-bold">
                creciente disociación entre diferentes áreas de la enseñanza
              </span>{' '}
              en todos los niveles educativos. Sumado a esto, actualmente experienciamos una{' '}
              <span className="font-bold text-[#46BFD7]">
                progresiva influencia de la tecnología en todas las áreas del conocimiento y esferas sociales.
              </span>{' '}
            </p>

            <div className="grid grid-cols-2  m-10 justify-center items-center ">
              <h1
                data-aos="fade-left"
                className={`${titulo.className} m-10 drop-shadow-lg bg-cyan-600 text-transparent bg-clip-text text-5xl`}
              >
                Es por ello que resulta necesario abordar los procesos de enseñanza y aprendizaje desde una perspectiva
                que nos permita →
              </h1>

              <Carousel className="w-[400px] ml-10 self-center">
                <CarouselContent>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
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
                  <CarouselItem className="flex flex-col place-content-center items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
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

        <div className="flex flex-col mx-20 gap-20">
          <div className="text-[1.4rem] m-10 p-10 bg-sky-200/30 rounded-xl">
            <p>
              Entendemos{' '}
              <span className="text-[#46BFD7] font-bold text-2xl">
                el juego como germen de la educación y de la creatividad
              </span>
              , que ocurre en la naturaleza espontánea y consistentemente{' '}
              <span className="text-[#46BFD7] font-bold text-2xl">con un rol didáctico:</span> cada especie juega como
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

          <div className="grid grid-cols-2 gap-4 items-center justify-center">
            <Image
              className="shadow-2xl w-fit ml-10 rounded-xl"
              data-aos="fade-left"
              src={'/img/Identidad2.JPG'}
              alt={'Grupo taller Ludidactas'}
              width={600}
              height={600}
            ></Image>
            <div data-aos="" className="flex flex-col items-center">
              <h1
                data-aos="fade-left"
                className={`${titulo.className} m-10 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-5xl`}
              >
                {' '}
                Con la motivación correcta el aprendizaje se da de una forma orgánica.
              </h1>

              <p
                data-aos="fade-up"
                data-aos-duration="500"
                className="text-[1.3rem] m-10 p-4 rounded-xl bg-white/50 border-dashed border-4 border-black"
              >
                Una educación al servicio de la productividad mercantilista no podrá dejar nunca de comparar y
                cuantificar, ni de organizar el deber en función de metas y expectativas preestablecidas, con la
                ansiedad que inevitablemente entraña. Educar en función de la empleabilidad tiene su lugar, pero no
                puede ser todos los lugares. Cuando se practica y se investiga por visión, y no por imposición, es que{' '}
                <span className="text-[#46BFD7]">
                  el verdadero aprendizaje tiene lugar, el que se siente como descubrir, no como adquirir
                </span>
                .
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 items-center justify-center w-fit">
            <div data-aos="fade-up" className="flex flex-col items-center">
              <h1
                data-aos="fade-left"
                className={`${titulo.className} m-10 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-5xl`}
              >
                Tomamos la forma que tome nuestra comunidad
              </h1>

              <p
                data-aos="fade-up"
                data-aos-duration="500"
                className="text-[1.3rem] m-10 p-10 bg-white/50 border-4 border-dashed border-black rounded-xl"
              >
                Enseñamos, en principio,
                <span className="text-[#46BFD7]">
                  {' '}
                  programación, matemática, ilustración digital y otras técnicas cercanas al desarrollo de videojuegos{' '}
                </span>
                , porque es el ámbito y contexto concreto donde el proyecto se originó. Pero esperamos eventualmente dar
                la bienvenida a talleres de música, circo, ciencias, huerta y más. Enseñamos computación, sistemas e
                informática como campos del conocimiento creativo, no como instrumentos de lucro, provecho y
                rendimiento.
              </p>
            </div>

            <Image
              className="shadow-2xl w-fit rounded-xl"
              data-aos="fade-right"
              src={'/img/Identidad3.png'}
              alt={'Taller Ludidactas 2'}
              width={1000}
              height={1000}
            ></Image>
          </div>
        </div>

        <p className="w-3/5 mx-auto text-[1.4rem] m-10 p-10 ">
          {' '}
          Desde Ludidactas, buscamos acometer esta labor desde una perspectiva lúdica y didáctica (de allí nuestro
          nombre), pues creemos que atendiendo al proceso didáctico-pedagógico podemos regenerar el tejido creativo.
          Para nosotros es importante cultivar la capacidad de hacer, no mediante procedimientos mecánicos, sino
          mediante <span className="text-[#46BFD7]">el juego</span> como via para enseñar con mayor inmunidad a{' '}
          <span className="text-[#46BFD7]">los síntomas de la repetición inadvertida</span>.
        </p>
      </div>
    </WithAOS>
  )
}

const IdMobile = () => {
  return (
    <WithAOS>
      <div className="block lg:hidden text-center">
        <div className="flex justify-center border-solid">
          <Image
            className="text-center w-full shadow-4xl rounded-xl "
            data-aos="zoom-in-down"
            src={'/img/Identidad1.png'}
            alt={'Grupo taller Ludidactas'}
            width={200}
            height={200}
          ></Image>
        </div>

        <div className="mt-10">
          <h1
            data-aos="fade-left"
            className={`${titulo.className} m-4 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-5xl`}
          >
            El hoy
          </h1>

          <div className="flex flex-col text-center  mx-4 p-2">
            <p className="text-xl p-8 bg-white border-2 border-black border-dashed rounded-xl mb-10">
              Uno de los desafíos que se nos presenta a los educadores en la actualidad es la{' '}
              <span className="text-[#46BFD7] font-bold">
                creciente disociación entre diferentes áreas de la enseñanza
              </span>{' '}
              en todos los niveles educativos. Sumado a esto, actualmente experienciamos una{' '}
              <span className="font-bold text-[#46BFD7]">
                progresiva influencia de la tecnología en todas las áreas del conocimiento y esferas sociales.
              </span>{' '}
            </p>

            <div className="flex flex-col  m-4 justify-center items-center ">
              <h1
                data-aos="fade-left"
                className={`${titulo.className} mb-4 drop-shadow-lg bg-cyan-600 text-transparent bg-clip-text text-4xl`}
              >
                Es por ello que resulta necesario abordar los procesos de enseñanza y aprendizaje desde una perspectiva
                que nos permita <br />↓
              </h1>

              <Carousel className="w-[250px] mx-4 self-center">
                <CarouselContent>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xs bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
                    <SpeechBubble>
                      La formación en el uso creativo de tecnologías contemporáneas, con el fin de reducir la brecha
                      entre tecnología y procesos de aprendizaje.
                    </SpeechBubble>
                    <Image
                      className="m-4 p-2  bg-white rounded-xl"
                      src={'/img/Pixel1.png'}
                      alt={''}
                      width={100}
                      height={100}
                    ></Image>
                  </CarouselItem>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xs bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
                    <SpeechBubble>
                      El diálogo y integración entre diversas áreas la educación, teniendo en cuenta que el proceso de{' '}
                      <span className="text-cyan-500">enseñanza-aprendizaje es un único fenómeno.</span>
                    </SpeechBubble>
                    <Image
                      className="m-6 p-2  bg-white rounded-xl"
                      src={'/img/Pixel2.png'}
                      alt={''}
                      width={100}
                      height={100}
                    ></Image>
                  </CarouselItem>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xs bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
                    <SpeechBubble>
                      Comprender que las condiciones para la enseñanza no están dadas por procedimientos mecánicos sino
                      por el juego como motor organizador del aprendizaje
                    </SpeechBubble>
                    <Image
                      className="m-6 p-2  bg-white rounded-xl"
                      src={'/img/Pixel3.png'}
                      alt={''}
                      width={100}
                      height={100}
                    ></Image>
                  </CarouselItem>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xs bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
                    <SpeechBubble>
                      Reivindicar el poder creativo del aprendizaje, orientándolo a la construcción de herramientas y
                      recursos didácticos.
                    </SpeechBubble>
                    <Image
                      className="m-6 p-2  bg-white rounded-xl"
                      src={'/img/Pixel4.png'}
                      alt={''}
                      width={100}
                      height={100}
                    ></Image>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="bg-[#1e1e1e] flex items-center justify-center text-white dark:bg-white" />
                <CarouselNext className="bg-[#1e1e1e] flex items-center justify-center text-white dark:bg-white" />
              </Carousel>
            </div>
          </div>
        </div>

        <div className="flex flex-col mx-4 gap-2">
          <div className="bg-sky-200/30 rounded-xl">
            <p className="text-xl m-4 p-8">
              Entendemos{' '}
              <span className="text-[#46BFD7] font-bold">el juego como germen de la educación y de la creatividad</span>
              , que ocurre en la naturaleza espontánea y consistentemente{' '}
              <span className="text-[#46BFD7] font-bold ">con un rol didáctico:</span> cada especie juega como le va a
              ser propio trabajar en su edad adulta.{' '}
            </p>

            <h1
              data-aos="fade-left"
              className={`${titulo.className} m-10 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-4xl`}
            >
              {' '}
              El juego nos facilita aprender con independencia de las formas. Nos muestra horizontes, que reclaman
              caminos.
            </h1>

            <p className="text-xl m-4 p-8">
              <span className="text-[#46BFD7] font-bold ">
                El juego es un proceso de ensayo y autoperfeccionamiento:
              </span>{' '}
              la actitud del ajedrecista, de la artista marcial, de un músico, de una gimnasta, que practica, ensaya y
              estudia, a fin de cuentas, para la partida, el enfrentamiento, la improvisación o la performarce.
            </p>
          </div>

          <h1
            data-aos="fade-left"
            className={`${titulo.className} m-10 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-4xl`}
          >
            {' '}
            Con la motivación correcta el aprendizaje se da de una forma orgánica.
          </h1>

          <Image
            className="shadow-lg w-full rounded-xl"
            data-aos="fade-left"
            src={'/img/Identidad2.JPG'}
            alt={'Grupo taller Ludidactas'}
            width={600}
            height={600}
          ></Image>

          <p
            data-aos="fade-up"
            data-aos-duration="500"
            className="text-xl m-4 p-8 rounded-xl bg-white/50 border-dashed border-4 border-black"
          >
            Consideramos las áreas de computación, sistemas e informática como campos que exceden por mucho las
            computadoras electrónicas y el software.
            <span className="text-[#46BFD7] font-bold">
              {' '}
              Por ello enseñamos, en principio, programación, matemática, ilustración digital y otras aptitudes que
              colaboren al sostén de los procesos pedagógicos
            </span>
            . Pero esperamos eventualmente dar la bienvenida a talleres de música, circo, ciencias, huerta y más.
          </p>

          <h1
            data-aos="fade-left"
            className={`${titulo.className} m-4 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-4xl`}
          >
            ¡Aprender no tiene por qué ser forzoso o mecánico!
          </h1>

          <Image
            className="shadow-xl w-full mb-4 rounded-xl"
            data-aos="fade-right"
            src={'/img/Identidad3.png'}
            alt={'Taller Ludidactas 2'}
            width={1000}
            height={1000}
          ></Image>

          <p
            data-aos="fade-up"
            data-aos-duration="500"
            className="text-xl m-4 p-8 bg-white/50 border-4 border-dashed border-black rounded-xl"
          >
            Nuestra perspectiva lúdica y didáctica (de allí nuestro nombre), pues creemos que atendiendo al proceso de
            transmisión de saberes podemos nutrir el poder creativo del aprendizaje. Para nosotros es importante{' '}
            <span className="text-[#46BFD7] font-bold">cultivar la capacidad de hacer</span>, no mediante procedimientos
            mecánicos, sino mediante{' '}
            <span className="text-[#46BFD7] font-bold">
              el juego como via para enseñar con mayor inmunidad a los síntomas de la repetición inadvertida.
            </span>
          </p>
        </div>
      </div>
    </WithAOS>
  )
}
export default function Page() {
  return (
    <>
      <IdDesktop />
      <IdMobile />
    </>
  )
}
