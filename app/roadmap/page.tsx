'use client'
import { SvgRoadmapProvider } from '@/components/roadmap/context'
import { LibretaProvider } from '@/components/context/libreta'

// Importamos Roadmap dinámicamente para que sea client-only.
// Lo ideal sería dejar de usar `useMediaQuery` y en su lugar usar
// responsiveness de css puro, para aprovechar los goodies de SSR.
import dynamic from 'next/dynamic'
const RoadmapClientOnly = dynamic(() => import('@/components/roadmap'), { ssr: false })

export default function Page() {
  return (
    <LibretaProvider>
      <SvgRoadmapProvider>
        <RoadmapClientOnly />
      </SvgRoadmapProvider>
    </LibretaProvider>
  )
}
