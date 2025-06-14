'use client'
import LdBannerVCabrera from '@/components/custom/ld-banner-vcabrera'

export default function Page() {

  return (
    <div className="h-screen w-screen mx-auto flex flex-col gap-8 items-center">
      <div className="p-8 w-4/5">
        <LdBannerVCabrera />
      </div>

      <div className="w-full h-24" />
    </div>
  )
}
