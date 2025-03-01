'use client'
import { PropsWithChildren, createRef, useEffect, useRef } from 'react'

const Textura = ({ children }: PropsWithChildren) => {
  const canvasContainer = createRef<HTMLDivElement>()
  const p5InstanceRef = useRef<any>(null)

  // Importamos e instanciamos p5 y el sketch todo client-side only:
  useEffect(() => {
    import('p5')
      .then(async (p5Module) => {
        const p5Constructor = p5Module.default

        const { default: sketch } = await import('./sketch')

        if (canvasContainer.current) {
          p5InstanceRef.current = new p5Constructor(sketch, canvasContainer.current)
        }
      })
      .catch((err) => {
        console.error('Error loading p5:', err)
      })

    return () => {
      if (p5InstanceRef.current && typeof p5InstanceRef.current.remove === 'function') {
        p5InstanceRef.current.remove()
        p5InstanceRef.current = null
      }
    }
  }, [canvasContainer])

  return (
    <div>
      <div ref={canvasContainer} className="fixed z-[-1]"></div>
      {children}
    </div>
  )
}

export default Textura
