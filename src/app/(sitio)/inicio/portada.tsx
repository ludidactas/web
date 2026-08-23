import ArrowDownLd from '@/components/custom/ld-arrow-down'
import { titulo } from '@/components/fonts'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const Portada = () => {
  return (
    <>
      <div className="portadaini min-h-[calc(100vh-256px)] flex flex-col items-center md:justify-between mb-20 mt-20 md:mt-0">
        <Image className="w-[80vw] md:w-[45vw] h-auto" src="/img/Compo.webp" alt="PortadaImg" width={2551} height={1920} />
        <h3 className={`${titulo.className} text-xl mb-20 mx-10 md:text-2xl lg:text-3xl text-center lg:mx-80 lg:mb-10`}>
          <span className="text-ld-azul lg:text-ld-azul-oscuro font-bold">Entrená con profes que practican</span> el arte
          de la programación, las animaciones y los videojuegos.
        </h3>

        <ArrowDownLd to="identidadini" />
      </div>
    </>
  )
}

export default Portada
