import BtnNeon from '@/components/custom/ld-btn-neon'
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
  <div className="border-4 border-black border-dashed rounded-xl m-5 p-2 bg-[#ffffb5]">
    <h1 className="m-2 drop-shadow-3xl text-3xl">Sábados de 11 a 13hs en Güemes</h1>
    <h1 className="text-2xl">Desde abril</h1>
  </div>
)
export default function page() {
  return (
    <div data-aos="fade-left" className="lg:mx-20 py-10 items-center text-center">
      <div className="flex flex-col lg:grid lg:grid-cols-2 place-content-between mx-10">
        <div className={`${titulo.className} flex flex-col items-center`}>
          {/* Desktop */}
          <Image className="hidden lg:block" src={'/img/CONVOCATORIA.png'} alt={''} width={450} height={450} />

          {/* Mobile */}
          <CarouselConvocatoria className="block lg:hidden">
            <Image src={'/img/CONVOCATORIA.png'} alt={''} width={450} height={450} />
          </CarouselConvocatoria>

          <InfoConv />

          <BtnNeon
            className="animate-bounce text-xl mb-10 text-center"
            target="_blank"
            href="https://docs.google.com/forms/d/e/1FAIpQLSeKNmg-ydPXK03bLYsI75M2lbodUWbcftTVDgTG2fLV2Wz8JA/viewform"
          >
            Formulario de inscripción
          </BtnNeon>
        </div>

        {/* Desktop */}
        <CarouselConvocatoria className="hidden lg:block" />
      </div>
    </div>
  )
}
