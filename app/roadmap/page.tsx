'use client'
import dynamic from 'next/dynamic'
import RoadCont from '@/app/roadmap/roadmapCont.mdx'

const Roadmap = dynamic(() => import('@/components/roadmap'), {
  ssr: false,
  loading: () => <div>Loading...</div>, // Optional loading state
})

export default function Page() {
  return <div className="p-10 px-20">
  <RoadCont/>  
  <Roadmap />
  </div>
}
