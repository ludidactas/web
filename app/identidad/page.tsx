import Image from 'next/image'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/ld-carousel'
import { Jersey} from '@/components/fonts'
import WithAOS from '@/components/ui/with-aos'
import { PropsWithChildren } from 'react'

function SpeechBubble({ children }: PropsWithChildren) {
  return (
    <div className="flex items-center justify-center mt-4 rounded-lg bg-gray-100">
      <div className="relative bg-white text-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
        {children}
        <div className="absolute right-25 -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-20 border-r-transparent border-t-8 border-t-white"></div>
      </div>
    </div>
  )
}
export default function Page() {
  return (
    <WithAOS>
      <div className="text-center">
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
            className={`${Jersey.className} m-10 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-7xl`}
          >
            ¿Qué nos motiva?
          </h1>

          <div className="flex flex-col text-center  mx-20 p-2">
            <p className="text-[1.4rem] m-10 p-10 f bg-white border-4 border-black border-dotted rounded-xl mb-10">
              Uno de los desafíos que se nos presenta a los educadores en la actualidad es la <span className='text-[#46BFD7] font-bold'>creciente disociación
              entre diferentes áreas de la enseñanza</span> en todos los niveles educativos. Sumado a esto, actualmente
              experienciamos una <span className='font-bold text-[#46BFD7]'>progresiva influencia de la tecnología en todas las áreas del conocimiento y esferas
              sociales.</span>{' '}
            </p>

            <div className="grid grid-cols-2  m-10 justify-center items-center ">
              <h1
                data-aos="fade-left"
                className={`${Jersey.className} m-10 drop-shadow-lg bg-cyan-600 text-transparent bg-clip-text text-5xl`}
              >
                Es por ello que resulta necesario abordar los procesos de enseñanza y aprendizaje desde una perspectiva
                que nos permita →
              </h1>

              {/* <h3 className="drop-shadow-lg ml-8 mx-10 text-cyan-500 text-left text-5xl">Es por ello que resulta necesario abordar los procesos de
                            enseñanza y aprendizaje desde una perspectiva que nos permita → </h3> */}

              <Carousel className=" w-[400px] ml-10 self-center">
                <CarouselContent>
                  <CarouselItem className="flex flex-col place-content-center items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
                    <SpeechBubble>
                      La formación en el uso creativo de tecnologías contemporáneas, con el fin de reducir la brecha
                      entre tecnología y procesos de aprendizaje.
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
                      El diálogo y integración entre diversas áreas la educación, teniendo en cuenta que el proceso de{' '}
                      <span className="text-cyan-500">enseñanza-aprendizaje es un único fenómeno.</span>
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
                      Comprender que las condiciones para la enseñanza no están dadas por procedimientos mecánicos sino
                      por el juego como motor organizador del aprendizaje
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
                      Reivindicar el poder creativo del aprendizaje, orientándolo a la construcción de herramientas y
                      recursos didácticos.
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
          <p className="text-[1.4rem] m-10 p-10 bg-sky-200/30 rounded-xl">
            Entendemos{' '}
            <span className="text-[#46BFD7] font-bold text-2xl">el juego como germen de la educación y de la creatividad</span>,
            que ocurre en la naturaleza espontánea y consistentemente <span className="text-[#46BFD7] font-bold text-2xl">con un rol didáctico:</span> cada especie juega como le
            va a ser propio trabajar en su edad adulta. También vemos al juego como un proceso de ensayo y
            autoperfeccionamiento: la actitud del ajedrecista, de la artista marcial, de un músico, de una gimnasta, que
            practica, ensaya y estudia, a fin de cuentas, para la partida, el enfrentamiento, la improvisación o la
            performarce.   <span className="text-[#8b5cf6] font-bold text-2xl">El juego nos facilita aprender con independencia de las formas. Nos muestra horizontes, que
            reclaman caminos.</span>
          </p>

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
                className={`${Jersey.className} m-10 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-5xl`}
              >
                {' '}
                Con la motivación correcta el aprendizaje se da de una forma orgánica.
              </h1>

              <p data-aos="fade-up"
    
     data-aos-duration="500" className="text-[1.3rem] m-10 p-4 rounded-xl bg-white/50 border-dashed border-4 border-black">
                Enseñamos, en principio,{' '}
                <span className="text-[#46BFD7]">
                  programación, matemática, ilustración digital y otras aptitudes que colaboren al sostén de los
                  procesos pedagógicos
                </span>
                . Pero esperamos eventualmente dar la bienvenida a talleres de música, circo, ciencias, huerta y más.
                Consideramos las áreas de computación, sistemas e informática como campos que exceden por mucho las
                computadoras electrónicas y el software.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 items-center justify-center mb-20 w-fit">
            <div data-aos="fade-up" className="flex flex-col items-center">
              <h1
                data-aos="fade-left"
                className={`${Jersey.className} m-10 drop-shadow-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-transparent bg-clip-text text-5xl`}
              >
                ¡Aprender no tiene por qué ser forzoso o mecánico!
              </h1>

              <p data-aos="fade-up"
    
    data-aos-duration="500" className="text-[1.3rem] m-10 p-10 bg-white/50 border-4 border-dashed border-black rounded-xl">
                Desde Ludidactas, buscamos acometer esta labor desde una perspectiva lúdica y didáctica (de allí nuestro
                nombre), pues creemos que atendiendo al proceso de transmisión de saberes podemos nutrir el poder
                creativo del aprendizaje. Para nosotros es importante cultivar la capacidad de hacer, no mediante
                procedimientos mecánicos, sino mediante <span className="text-[#46BFD7]">el juego</span> como via para
                enseñar con mayor inmunidad a los síntomas de la repetición inadvertida.
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
      </div>
    </WithAOS>
  )
}
