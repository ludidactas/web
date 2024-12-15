'use client'
import { useEffect, useRef, useState } from 'react'
import Roadmap from './roadmap.svg'
// import { useRouter } from 'next/navigation'
import { ModeToggle } from '@/components/ui/mode-toggle'
import MdDrawer from '@/components/custom/md-drawer'

export default function Home() {
  // const router = useRouter()
  const svgRef = useRef<SVGAElement>()
  const [articulo, setArticulo] = useState<null | string>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Targeteamos los elementos con id que empiecen con 'rm.' y suscribimos eventos
  useEffect(() => {
    if (svgRef.current) {
      const elementos_con_id = svgRef.current.querySelectorAll('[id*="rm."]')
      elementos_con_id.forEach((elemento) => {
        const id = elemento.id.split('.')[1]
        elemento.addEventListener('click', () => {
          console.log(`click en ${id}`)
          setArticulo(id)
          setIsOpen(true)
          // router.push(`/a/${id}`)
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
      <ModeToggle />
      {articulo && <MdDrawer articulo={articulo} isOpen={isOpen} setIsOpen={setIsOpen} />}
      <Roadmap ref={svgRef} />
    </div>
  )
}
