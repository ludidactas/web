'use client'
import { useEffect, useRef } from 'react'
import Roadmap from './roadmap.svg'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const svgRef = useRef<SVGAElement>()

  // Targeteamos los elementos con id que empiecen con 'rm.' y suscribimos eventos
  useEffect(() => {
    if (svgRef.current) {
      const elementos_con_id = svgRef.current.querySelectorAll('[id*="rm."]')
      elementos_con_id.forEach((elemento) => {
        const id = elemento.id.split('.')[1]
        elemento.addEventListener('click', () => {
          console.log(`click en ${id}`)
          router.push(`/a/${id}`)
        })
        elemento.addEventListener('mouseenter', () => {
          console.log(`mouseenter en ${id}`)
        })
        elemento.addEventListener('mouseleave', () => {
          console.log(`mouseleave en ${id}`)
        })
      })
    }
  }, [svgRef])

  return (
    <div className="p-8">
      <h1>POC Roadmaps</h1>
      <Roadmap ref={svgRef} />
    </div>
  )
}
