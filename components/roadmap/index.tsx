'use client'
import RoadmapSvg from '@/app/roadmap.svg'
import { useEffect, useRef, useState } from 'react'

import './roadmap.css'
import { Articulo } from '@/md'

interface RoadmapProps {
  onFocus?: (id: Articulo) => void
  onUnfocus?: (id: Articulo) => void
  onClick?: (id: Articulo) => void
}

// Útil https://react-typescript-cheatsheet.netlify.app
// Pendiente https://github.com/7PH/powerglitch

export default function Roadmap({ onFocus, onUnfocus, onClick }: RoadmapProps) {
  // Ref para el svg
  const svgRef = useRef<SVGAElement>()

  // Targeteamos los elementos con id que empiecen con 'rm.' y suscribimos eventos
  useEffect(() => {
    if (svgRef.current) {
      // Recogemos todos los elementos svg que tengan un id que comienza con "rm."
      const elementos_con_id = svgRef.current.querySelectorAll('[id*="rm."]')

      // Para cada uno
      elementos_con_id.forEach((elemento) => {
        // Obtenemos la parte del id que venga después del punto
        const id = elemento.id.split('.')[1] as Articulo

        // Si no está entre los artículos enumerados, volvermos
        if (!Object.values(Articulo).includes(id)) {
          console.log(`${id} no está entre los artículos enumerados`)
          return
        }

        // Lo claseamos como nodo
        elemento.classList.add('nodo')

        // Al hacerle click, abrimos el cajón y le pasamos este id
        elemento.addEventListener('click', () => {
          if (onClick) onClick(id)
        })

        // Al entrar, le aplicamos la clase "activo"
        elemento.addEventListener('mouseenter', () => {
          if (onFocus) onFocus(id)
          elemento.classList.add('activo')
        })

        // Al salir, se la quitamos
        elemento.addEventListener('mouseleave', () => {
          if (onUnfocus) onUnfocus(id)
          elemento.classList.remove('activo')
        })
      })
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
