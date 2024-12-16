'use client'
import RoadmapSvg from '@/app/roadmap.svg'
import { useEffect, useRef, useState } from 'react'
import RoadmapDrawer from '@/components/custom/ld-drawer'

export default function Roadmap() {

  // Ref para el svg
  const svgRef = useRef<SVGAElement>()

  // Nombre del artículo que se halla clickeado
  const [articulo, setArticulo] = useState<null | string>(null)

  // Estado del drawer
  const [isCajonAbierto, setIsCajonAbierto] = useState(false)

  // Targeteamos los elementos con id que empiecen con 'rm.' y suscribimos eventos
  useEffect(() => {
    if (svgRef.current) {

      // Recogemos todos los elementos svg que tengan un id que comienza con "rm."
      const elementos_con_id = svgRef.current.querySelectorAll('[id*="rm."]')

      // Para cada uno
      elementos_con_id.forEach((elemento) => {

        // Obtenemos la parte del id que venga después del punto
        const id = elemento.id.split('.')[1]

        // Al hacerle click, abrimos el cajón y le pasamos este id
        elemento.addEventListener('click', () => {
          console.log(`click en ${id}`)
          setArticulo(id)
          setIsCajonAbierto(true)
        })

        // Al entrar, le aplicamos la clase "activo"
        elemento.addEventListener('mouseenter', () => {
          console.log(`mouseenter en ${id}`)
          elemento.classList.add('activo')
        })

        // Al salir, se la quitamos
        elemento.addEventListener('mouseleave', () => {
          console.log(`mouseleave en ${id}`)
          elemento.classList.remove('activo')
        })
      })
    }
  }, [svgRef])

  return (
    <div className="p-8">
      {/* Si `articulo` está definida, renderizamos el drawer */}
      {articulo && <RoadmapDrawer articulo={articulo} isOpen={isCajonAbierto} setIsOpen={setIsCajonAbierto} />}
      {/* Renderizamos el SVG y le pasamos el ref */}
      <div className='flex flex-col items-center'>
        <RoadmapSvg height={'100vh'} ref={svgRef} />
      </div>
    </div>
  )
}
