import ArrowDownLd from '@/components/custom/ld-arrow-down'
import { titulo } from '@/components/fonts'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const Portada = () => {
  return (<>
    <div className="portadaini h-[100vh] flex flex-col items-center mb-20 mt-20 md:mt-0">
      <Image className="w-[80vw] md:w-[45vw]" src="/img/Compo.png" alt="PortadaImg" width={1000} height={1000} />
      <h3 className={`${titulo.className} text-xl mb-20 mx-10 md:text-2xl lg:text-3xl text-center lg:mx-80 lg:mb-10`}>
        <span className="text-[#46BFD7] lg:text-[#4198AA] font-bold">Entrená con profes que practican</span> el arte de la programación, las
        animaciones y los videojuegos.
      </h3>

      <ArrowDownLd to="identidadini" />

    </div>
    <div className={cn('shape-divider-waves-bottom w-full text-white')}/>

  </>
  )
}

export default Portada
