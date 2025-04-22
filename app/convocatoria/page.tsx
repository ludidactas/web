import BtnSketchy from '@/components/custom/ld-btn-sketchy'
import { titulo } from '@/components/fonts'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/ld-carousel'
import Image from 'next/image'
import { ComponentProps } from 'react'

const CarouselConvocatoria = ({ children, className }: ComponentProps<typeof Carousel>) => (
  <Carousel
    className={`self-center m-4 w-full border-4 border-black rounded-xl border-dashed bg-cyan-100/50 ${className}`}
  >
    <CarouselContent className="items-center">
      {children && <CarouselItem className="p-8">{children}</CarouselItem>}
      <CarouselItem className="p-8">
        <Image className="w-full " src={'/img/slide1.png'} alt={''} width={500} height={200}></Image>
      </CarouselItem>
      <CarouselItem className="p-8 w-fit">
        <Image className="w-full " src={'/img/slide2.png'} alt={''} width={500} height={200}></Image>
      </CarouselItem>
      <CarouselItem className="p-8 w-fit">
        <Image className="w-full " src={'/img/slide3.png'} alt={''} width={500} height={200}></Image>
      </CarouselItem>
      <CarouselItem className="p-8 w-fit">
        <Image className="w-full " src={'/img/slide4.png'} alt={''} width={500} height={200}></Image>
      </CarouselItem>
      <CarouselItem className="p-8 w-fit">
        <Image className="w-full " src={'/img/slide5.png'} alt={''} width={500} height={200}></Image>
      </CarouselItem>
      <CarouselItem className="p-8 w-fit">
        <Image className="w-full " src={'/img/slide6.png'} alt={''} width={500} height={200}></Image>
      </CarouselItem>

      <CarouselItem className="p-8 w-fit">
        <Image className="w-full " src={'/img/slide7.png'} alt={''} width={500} height={200}></Image>
      </CarouselItem>
      <CarouselItem className="p-8 w-fit">
        <Image className="w-full " src={'/img/slide8.png'} alt={''} width={500} height={200}></Image>
      </CarouselItem>
    </CarouselContent>
    <CarouselPrevious className="bg-[#1e1e1e] flex items-center justify-center text-white dark:bg-white" />
    <CarouselNext className="bg-[#1e1e1e] flex items-center justify-center text-white dark:bg-white" />
  </Carousel>
)

const InfoConv = () => (
  <div className="border-4 border-black border-dashed rounded-xl m-5 p-2 bg-[#ffffb5] mb-10">
    <h1 className="m-2 drop-shadow-3xl text-3xl">Estamos a la espera de respuesta para disponer de espacio</h1>
    <h1 className="text-2xl">Igual podés llenar el formulario y te contactamos pronto :)</h1>
  </div>
)
export default function Page() {
  return (
    <div data-aos="fade-left" className="lg:mx-20 items-center text-center">
      {/* Banner */}
      <div className="bg-[url(/img/tincho.jpg)] bg-contain bg-center bg-no-repeat w-full h-[200px] md:h-[380px]" />

      <div className={`${titulo.className} flex flex-col items-center`}>

        {/* Mobile */}
        <CarouselConvocatoria className="block lg:hidden">
          {/* <Image src={'/img/CONVOCATORIA.png'} alt={''} width={450} height={450} /> */}
        </CarouselConvocatoria>

        <InfoConv />

        <BtnSketchy
          className="animate-bounce text-xl mb-10 text-center h-[3em] leading-8"
          target="_blank"
          href="https://docs.google.com/forms/d/e/1FAIpQLSeKNmg-ydPXK03bLYsI75M2lbodUWbcftTVDgTG2fLV2Wz8JA/viewform"
        >
          Inscripción
        </BtnSketchy>
      </div>

      {/* Desktop */}
      <CarouselConvocatoria className="hidden lg:block w-1/2 mx-auto" />
    </div>
  )
}
