'use client'

import LdBannerVCabrera from '@/components/custom/ld-banner-vcabrera'
// Banners de la convocatoria a talleristas que no fue
// import LdBannerConvocatoria from '@/components/custom/ld-banner-convocatoria'
// import LdBannerConvocatoriaMobile from '@/components/custom/ld-banner-convocatoria-mobile'

import LdBannerVCabreraMobile from '@/components/custom/ld-banner-vcabrera-mobile'
import { CircleChevronDown } from 'lucide-react'
import { Link as Scroll } from 'react-scroll'

const HeroMobile = () => {
  return (
    <>
      <LdBannerVCabreraMobile />

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
      <div className="lg:hidden w-screen flex flex-col items-center">
        <HeroMobile />
      </div>
      <div className="hidden lg:block">
        <LdBannerVCabrera className="w-[80vw]" />
      </div>
    </>
  )
}

export default Hero
