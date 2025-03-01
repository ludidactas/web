'use client'
import React, { PropsWithChildren, createRef, useEffect, useState } from 'react'
import sketch from './sketch'

const Textura = ({ children }: PropsWithChildren) => {
  const canvasContainer = createRef<HTMLDivElement>()
  const [p5, setP5] = useState<any>()

  // Cargamos dinámicamente p5 al cargar el componente - client side _only_
  useEffect(() => {
    import('p5').then((p5Module) => {
      setP5(p5Module.default)
    })
  }, [])

  useEffect(() => {
    if (p5) {
      const myp5 = new p5(sketch, canvasContainer.current!)
      return () => {
        myp5.remove()
      }
    }
  }, [p5, canvasContainer])

  return (
    <div>
      <div ref={canvasContainer} className="fixed z-[-1]"></div>
      {children}
    </div>
  )
}

export default Textura
