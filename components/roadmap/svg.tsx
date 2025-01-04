'use client'

/**
 * Componente que monta el svg con los listeners que se le provean
 */

import RoadmapSvg from '@/app/roadmap.svg'
import { useContext, useEffect } from 'react'

import './roadmap.css'
import { esMateria } from '@/md'
import { Materia } from '@/md/schema'
import ContextoSvgRoadmap from './context'

// Los tres eventos en el roadmap pasan id y elemento HTML
export type RoadmapEvent = (id: Materia | null) => void

interface RoadmapSvgProps {
  onClick?: RoadmapEvent
  onFocus?: RoadmapEvent
  onUnfocus?: RoadmapEvent
}

export default function SvgRoadmap({ onClick, onFocus, onUnfocus }: RoadmapSvgProps) {
  // Ref para el svg

  const { clicked, setClicked, setFocused, svgRef } = useContext(ContextoSvgRoadmap)

  // Targeteamos los elementos con id que empiecen con 'rm.' y suscribimos eventos
  useEffect(() => {
    if (svgRef.current) {
      console.log(`Montando svg...`)

      // Recogemos todos los elementos svg que tengan un id que comienza con "rm."
      const elementos_con_id = svgRef.current.querySelectorAll('[id*="rm."]')

      // Para cada uno
      elementos_con_id.forEach((elemento) => {
        // Obtenemos la parte del id que venga después del punto
        const id = elemento.id.split('.')[1]

        // Si no está entre los artículos enumerados, nos lo salteamos
        if (!esMateria(id)) return

        // Lo claseamos como nodo
        elemento.classList.add('nodo')

        // Al hacer click
        elemento.addEventListener('click', () => {
          // Si clickeamos el que ya está clickeado, pasamos a null
          const seleccionado = id == clicked ? null : id

          console.log(id, clicked, seleccionado)

          // Le removemos la clase 'clicked' a todas y se la agreagamos a este si el seleccionado no es null
          elementos_con_id.forEach((el) => el.classList.remove('clicked'))
          if (seleccionado) elemento.classList.add('clicked')

          // Updateamos state
          setClicked(seleccionado)
          if (onClick) onClick(seleccionado)
        })

        // Al entrar el mouse, le aplicamos la clase "activo"
        elemento.addEventListener('mouseenter', () => {
          elemento.classList.add('hovereado')
          setFocused(id)
          if (onFocus) onFocus(id)
        })

        // Al salir el mouse, se la quitamos
        elemento.addEventListener('mouseleave', () => {
          elemento.classList.remove('hovereado')
          setFocused(null)
          if (onUnfocus) onUnfocus(id)
        })
      })
      // setMontado(true)
    }
  }, [svgRef])

  return (
    <div className="p-8">
      {/* Renderizamos el SVG y le pasamos el ref */}
      <div className="flex flex-col items-center">
        <RoadmapSvg height={'100vh'} ref={svgRef} />
      </div>
    </div>
  )
}
