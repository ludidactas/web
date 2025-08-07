'use client'

import { CircleChevronDown } from 'lucide-react'
import { Link as Scroll } from 'react-scroll'

const HeroMobile = () => {
  return (
    <>
      {/* <LdBannerVCabreraMobile /> */}

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
        {/* <LdBannerVCabrera className="w-[80vw]" /> */}
      </div>
    </>
  )
}

export default Hero
