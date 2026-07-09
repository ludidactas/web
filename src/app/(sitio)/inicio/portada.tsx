import ArrowDownLd from '@/components/custom/ld-arrow-down'
import { titulo } from '@/components/fonts'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const Portada = () => {
  return (
    <>
      <div className="portadaini h-[calc(100vh-256px)] flex flex-col items-center md:justify-between mb-20 mt-20 md:mt-0">
        <Image className="w-[80vw] md:w-[45vw]" src="/img/Compo.webp" alt="PortadaImg" width={1000} height={1000} />
        <h3 className={`${titulo.className} text-xl mb-20 mx-10 md:text-2xl lg:text-3xl text-center lg:mx-80 lg:mb-10`}>
          <p>
            Formá parte de este{' '}
            <span className="my-4 text-[#46BFD7] font-bold outlined">laboratorio digital, lúdico y educativo</span>
          </p>
        </h3>

        <ArrowDownLd to="identidadini" />
      </div>
    </>
  )
}

export default Portada
