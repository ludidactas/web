'use client'
import { SvgRoadmapProvider } from '@/components/roadmap/context'
import MontajeRoadmap from '@/components/roadmap'
import { LibretaProvider } from '@/components/context/libreta'

export default function Page() {
  return (
    <LibretaProvider>
      <SvgRoadmapProvider>
        <MontajeRoadmap />
      </SvgRoadmapProvider>
    </LibretaProvider>
  )
}
