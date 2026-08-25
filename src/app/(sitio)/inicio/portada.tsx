import ArrowDownLd from '@/components/custom/ld-arrow-down'
import { titulo } from '@/components/fonts'
import Image from 'next/image'

const Portada = () => {
  return (
    <>
      <div className="portadaini min-h-[calc(100vh-256px)] flex flex-col items-center md:justify-between mb-20 mt-20 md:mt-0">
        <Image
          className="w-[80vw] md:w-[45vw] h-auto"
          src="/img/Compo.webp"
          alt="PortadaImg"
          width={2551}
          height={1920}
        />
        <h3 className={`${titulo.className} text-xl mb-20 mx-10 md:text-2xl lg:text-3xl text-center lg:mx-80 lg:mb-10`}>
          <span className="text-ld-violeta lg:text-ld-violeta-oscuro font-bold">Taller lúdico</span>,{' '}
          <span className="text-ld-azul lg:text-ld-azul-oscuro  font-bold">laboratorio didácto</span>,{' '}
          <span className="text-ld-magenta lg:text-ld-magenta font-bold">motor pedagógico</span>.
        </h3>

        <ArrowDownLd to="identidadini" />
      </div>
    </>
  )
}

export default Portada
