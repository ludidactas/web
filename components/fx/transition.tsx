import React, { useState, useEffect, PropsWithChildren } from 'react'

interface TransitionProps extends PropsWithChildren {
  show: boolean
  ms?: number
}

// FadeTransition component that handles the fade animation
export default ({ show, children, ms = 300 }: TransitionProps) => {
  const [shouldRender, setShouldRender] = useState(show)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Cuando show se active
    if (show) {
      // Renderizamos el contenido
      setShouldRender(true)

      // Y programamos activar la visibilidad para el próximo ciclo de render
      // (sino no se triggerea bien la transición)
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      // Cuando se desactive seguimos el orden inverso, invisibilizamos primero...
      setIsVisible(false)

      // Y des-renderizamos después
      const timer = setTimeout(() => setShouldRender(false), ms) // match transition duration
      return () => clearTimeout(timer)
    }
  }, [show])

  return (
    <div
      className={`
        transition-opacity duration-300 ease-in-out
        ${shouldRender ? 'block' : 'hidden'}
      `}
      style={{ opacity: isVisible ? 1 : 0, transition: `${ms}ms` }}
    >
      {children}
    </div>
  )
}
