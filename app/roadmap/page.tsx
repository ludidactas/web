'use client'
import dynamic from 'next/dynamic'

const Roadmap = dynamic(() => import('@/components/roadmap'), {
  ssr: false,
  loading: () => <div>Loading...</div>, // Optional loading state
})

export default function Page() {
  return <Roadmap />
}
