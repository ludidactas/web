'use client'

import LdBannerConvocatoria from '@/components/custom/ld-banner-convocatoria'
import LdBannerConvocatoriaMobile from '@/components/custom/ld-banner-convocatoria-mobile'
import { CircleChevronDown } from 'lucide-react'
import { Link as Scroll } from 'react-scroll'

const HeroTincho = () => {
  return (
    <div
    // className="relative bg-[url(/img/tincho.jpg)] bg-contain bg-center bg-no-repeat w-screen h-[380px] my-12"
    >
      <LdBannerConvocatoria/>
      {/* <BtnSketchy
        className="absolute w-40 h-20 text-2xl text-center leading-[56px] bottom-0 right-1/4"
        href="/convocatoria"
      >
        Convocatoria
      </BtnSketchy> */}
    </div>
  )
}

const HeroMobile = () => {
  return (
    <>
      <LdBannerConvocatoriaMobile />

      <div className="w-[8vw] my-10">
        <Scroll to="portadaini" smooth={true} duration={500}>
          <CircleChevronDown className="animate-bounce bg-white rounded-full w-full h-full" />
        </Scroll>
      </div>
    </>
  )
}

const Hero = () => {
  return (
    <>
      <div className="block lg:hidden w-screen flex flex-col items-center">
        <HeroMobile />
      </div>
      <div className="hidden lg:block">
        {/* <HeroDesktop /> */}
        <HeroTincho />
      </div>
    </>
  )
}

export default Hero
