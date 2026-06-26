import ArrowDownLd from '@/components/custom/ld-arrow-down'
import { titulo } from '@/components/fonts'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const Portada = () => {
  return (
    <>
      <div className="portadaini h-[100vh] flex flex-col items-center mb-20 mt-20 md:mt-0">
        <Image className="w-[80vw] md:w-[45vw]" src="/img/Compo.webp" alt="PortadaImg" width={1000} height={1000} />
        <h3 className={`${titulo.className} text-xl mb-20 mx-10 md:text-2xl lg:text-3xl text-center lg:mx-80 lg:mb-10`}>
          <p className='my-4 text-[#8345fd] font-bold outlined'>Laboratorio didáctico de educación emergente. </p><p>Participá de los talleres, conocé los recursos y </p>
          <p className="text-[#46BFD7] font-bold"> sé parte de esta comunidad lúdica.</p> 
            
        </h3>

        <ArrowDownLd to="identidadini" />
      </div>
      <div className={cn('shape-divider-waves-bottom w-full text-white')} />
    </>
  )
}

export default Portada
