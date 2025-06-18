import ArrowDownLd from '@/components/custom/ld-arrowDown'
import { titulo } from '@/components/fonts'
import Image from 'next/image'

const Portada = () => {
  return (
    <div className="portadaini w-[100vw] h-[100vh] mt-20 flex flex-col items-center justify-center mb-20">
      <Image className="aspect-auto object-fill" src="/img/Compo.png" alt="PortadaImg" width={1000} height={1000} />

      <h3 className={`${titulo.className} text-2xl lg:text-3xl text-center lg:mx-80 lg:mb-20`}>
        <span className="text-[#46BFD7] lg:text-[#4198AA] font-bold">Entrená con profes que practican</span> el arte de la programación, las
        animaciones y los videojuegos.
      </h3>

      <ArrowDownLd to="identidadini" />
    </div>
  )
}

export default Portada
