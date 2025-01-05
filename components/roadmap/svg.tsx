'use client'

/**
 * Componente que monta el svg con los listeners que se le provean
 */

import RoadmapSvg from '@/app/roadmap.svg'
import { useCallback, useContext, useEffect } from 'react'

import { esMateria } from '@/md'
import { Materia } from '@/md/schema'
import ContextoSvgRoadmap from './context'
import './roadmap.css'

// Los tres eventos en el roadmap pasan id y elemento HTML
export type RoadmapEvent = (id: Materia | null) => void

interface RoadmapSvgProps {
  onClick?: RoadmapEvent
  onFocus?: RoadmapEvent
  onUnfocus?: RoadmapEvent
}

export default function SvgRoadmap({ onClick, onFocus, onUnfocus }: RoadmapSvgProps) {
  const { clicked, setClicked, setFocused, svgRef } = useContext(ContextoSvgRoadmap)

  // Define handlers with useCallback to maintain stable references
  const clickHandler = useCallback(
    (id: Materia, elem: Element) => {
      const seleccionado = id == clicked ? null : id

      // Get elements inside the handler to ensure we have current state
      const elementos_con_id = svgRef.current?.querySelectorAll('[id*="rm."]')
      if (elementos_con_id) {
        elementos_con_id.forEach((el) => el.classList.remove('clicked'))
      }
      if (seleccionado) elem.classList.add('clicked')

      setClicked(seleccionado)
      if (onClick) onClick(seleccionado)
    },
    [clicked, onClick, svgRef]
  )

  const mouseEnterHandler = useCallback(
    (id: Materia, elem: Element) => {
      elem.classList.add('hovereado')
      setFocused(id)
      if (onFocus) onFocus(id)
    },
    [onFocus, setFocused]
  )

  const mouseLeaveHandler = useCallback(
    (id: Materia, elem: Element) => {
      elem.classList.remove('hovereado')
      setFocused(null)
      if (onUnfocus) onUnfocus(id)
    },
    [onUnfocus, setFocused]
  )

  // Effect now just manages attaching/detaching listeners
  useEffect(() => {
    if (!svgRef.current) return

    const elementos_con_id = svgRef.current.querySelectorAll('[id*="rm."]')
    const listeners: Array<{ element: Element; cleanup: () => void }> = []

    elementos_con_id.forEach((elemento) => {
      const id = elemento.id.split('.')[1]
      if (!esMateria(id)) return

      elemento.classList.add('nodo')

      // Create bound handlers
      const clickFn = () => clickHandler(id, elemento)
      const enterFn = () => mouseEnterHandler(id, elemento)
      const leaveFn = () => mouseLeaveHandler(id, elemento)

      // Add listeners
      elemento.addEventListener('click', clickFn)
      elemento.addEventListener('mouseenter', enterFn)
      elemento.addEventListener('mouseleave', leaveFn)

      // Store cleanup
      listeners.push({
        element: elemento,
        cleanup: () => {
          elemento.removeEventListener('click', clickFn)
          elemento.removeEventListener('mouseenter', enterFn)
          elemento.removeEventListener('mouseleave', leaveFn)
          elemento.classList.remove('nodo')
        },
      })
    })

    // Cleanup function
    return () => {
      listeners.forEach(({ cleanup }) => cleanup())
    }
  }, [clickHandler, mouseEnterHandler, mouseLeaveHandler, svgRef])

  return (
    <div className="p-8">
      <div className="flex flex-col items-center">
        <RoadmapSvg height={'100vh'} ref={svgRef} />
      </div>
    </div>
  )
}
