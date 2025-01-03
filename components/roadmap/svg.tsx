'use client'

/**
 * Componente que monta el svg con los listeners que se le provean
 */

import RoadmapSvg from '@/app/roadmap.svg'
import { useEffect, useRef, useState } from 'react'

import './roadmap.css'
import { esMateria, Materia } from '@/md'

// Los tres eventos en el roadmap pasan id y elemento HTML
export type RoadmapEvent = (id: Materia | null) => void

interface RoadmapProps {
  onFocus?: RoadmapEvent
  onUnfocus?: RoadmapEvent
  onClick?: RoadmapEvent
}

export default function Roadmap({ onFocus, onUnfocus, onClick }: RoadmapProps) {
  // Ref para el svg
  const svgRef = useRef<SVGAElement>()

  const [clicked, setClicked] = useState<Materia | null>(null)

  // Targeteamos los elementos con id que empiecen con 'rm.' y suscribimos eventos
  useEffect(() => {
    if (svgRef.current) {
      console.log(`Montando svg...`)

      // Recogemos todos los elementos svg que tengan un id que comienza con "rm."
      const elementos_con_id = svgRef.current.querySelectorAll('[id*="rm."]')

      // Para cada uno
      elementos_con_id.forEach((elemento) => {
        // Obtenemos la parte del id que venga después del punto
        const id = elemento.id.split('.')[1] as Materia

        // Si no está entre los artículos enumerados, volvermos
        if (!esMateria(id)) {
          console.log(`${id} no está entre los artículos enumerados`)
          return
        }

        // Lo claseamos como nodo
        elemento.classList.add('nodo')

        // Al hacerle click, abrimos el cajón y le pasamos este id
        elemento.addEventListener('click', () => {
          // Si clickeamos el que ya está clickeado, pasamos a null
          const estado = id == clicked ? null : id
          if (onClick) onClick(estado)

          console.log(`Click en ${id}`, estado, clicked)

          // Le removemos la clase 'clicked' a todas y se la agreagamos a este si el estado no es null
          elementos_con_id.forEach((el) => el.classList.remove('clicked'))
          if (estado) elemento.classList.add('clicked')

          // Updateamos state
          setClicked(estado)
        })

        // Al entrar, le aplicamos la clase "activo"
        elemento.addEventListener('mouseenter', () => {
          if (onFocus) onFocus(id)
          elemento.classList.add('hovereado')
        })

        // Al salir, se la quitamos
        elemento.addEventListener('mouseleave', () => {
          if (onUnfocus) onUnfocus(id)
          elemento.classList.remove('hovereado')
        })
      })
      // setMontado(true)
    }
  }, [svgRef, clicked])

  return (
    <div className="p-8">
      {/* Renderizamos el SVG y le pasamos el ref */}
      <div className="flex flex-col items-center">
        <RoadmapSvg height={'100vh'} ref={svgRef} />
      </div>
    </div>
  )
}
