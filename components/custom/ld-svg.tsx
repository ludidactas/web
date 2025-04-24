import { Box, SVG, Element as SvgElement } from '@svgdotjs/svg.js'
import { useRef, useState, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { entries } from 'remeda'

interface LdSvgProps<SvgIds extends string, SvgSlotIds extends string> {
  SvgComponent: any
  setup?: (nodos: Record<SvgIds | SvgSlotIds, SvgElement>) => void
  animation?: (dt: number, nodos: Record<SvgIds | SvgSlotIds, SvgElement>) => void
  ids?: SvgIds[]
  slots?: Record<SvgSlotIds, ReactNode>
  className?: string
}

/**
 * Extrae referencias a los elementos targeteados en un svg exportado de un
 * programa de diseño, y les anexa un setup y loop para producir animaciones
 *
 * **SvgComponent**: componente importado (vía svgr) de un `.svg`
 *
 * **ids**: lista de ids que se espera encontrar (los que se hayan exportado del archivo de diseño).
 * Hay que anotarla con `as const` para que el tipado dinámico funcione.
 *
 * **slots**: record que mapea ids de slots (los que se hayan exportado del archivo de diseño)
 * a componentes de react o cualquier fragmento que se quiera renderizar en su lugar.
 */
export function LdSvg<SvgIds extends string, SvgSlotIds extends string>({
  SvgComponent,
  setup,
  animation,
  ids = [] as const,
  //@ts-ignore
  slots = {} as const,
  className = '',
}: LdSvgProps<SvgIds, SvgSlotIds>) {
  // Ref al svg base
  const svgRef = useRef<SVGElement>()

  // Ref a los nodos: <id, nodoSvg>
  const nodosRef = useRef<Record<SvgIds | SvgSlotIds, SvgElement>>()

  // Ref a los slots: <id, SVGForeignObjectElement>
  const slotsRef = useRef<Record<SvgSlotIds, SVGForeignObjectElement>>()

  // Ref al current animationFrame
  const animationFrameRef = useRef<number>()

  // Flag para invisibilizar el componente hasta que termine de correr el `setup` (sino flashea)
  const [show, setShow] = useState(false)

  // Gather y setup de nodos (cuando se monta el svg)
  useEffect(() => {
    if (svgRef.current) {
      // Seleccionamos todos los nodos listados en la lista de ids **y slots**
      // y los pasamos por el constructor de SVG (de la librería @svgdotjs/svg.js)
      const nodosSvg = [...ids, ...Object.keys(slots)].map((id) => [id, crearElem(svgRef.current, id)])

      // Construimos el mapeo de id a nodos
      nodosRef.current = Object.fromEntries(nodosSvg)

      // Creamos los slots y los devolvemos
      const idsSlots = Object.keys(slots).map(id => [id, crearSlot(svgRef.current, id)])

      // Lo convertimos en map
      slotsRef.current = Object.fromEntries(idsSlots)
    }
  }, [ids, svgRef])

  // Trigger de setup y animación
  useEffect(() => {
    // Función del main loop
    const updateAnimation = (dt: number) => {
      // Aplicar animación a los nodos
      if (nodosRef.current && animation) {
        animation(dt, nodosRef.current)
      }

      // Solicitar siguiente frame
      animationFrameRef.current = requestAnimationFrame(updateAnimation)
    }

    // Aplicar setup
    if (setup) setup(nodosRef.current)

    // Arrancar main loop
    animationFrameRef.current = requestAnimationFrame(updateAnimation)
    setShow(true)

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [setup, animation])

  return <>
    <SvgComponent className={` ${show ? 'visible' : 'invisible'} ${className} `} ref={svgRef} />
    {/* Le chantamos el contenido en los slots */}
    {slotsRef.current && entries(slotsRef.current).map(([slotId, container]) => createPortal(
      slots[slotId], container, slotId
    ))}
        
  </>
}

/** 
 * Le setea una bbox a un elemento SVG, y lo devuelve
 */
function setBBox<T extends SVGElement>(bbox: Box, target: T) {
  target.setAttribute('x', bbox.x.toString())
  target.setAttribute('y', bbox.y.toString())
  target.setAttribute('width', bbox.width.toString())
  target.setAttribute('height', bbox.height.toString())
  return target
}

/**
 * Nota: muta el svg!
 */
function crearSlot(svg: SVGElement, id: string) {

  // Agarramos el elemento SVG a partir del id
  const nodoTarget = SVG(svg.querySelector(`[id="${id}"]`))

  // Creamos un foreignObject con las dimensiones de la bbox del slot
  // Nota: el placeholder lo tuve que dibujar con pen (es un path) porque la herramienta
  // rect estaba produciendo un cuadrado con un transform, y eso jode el placement
  const foreignObject = setBBox(nodoTarget.bbox(), document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'))

  // Reemplazamos 
  nodoTarget.parent().add(SVG(foreignObject) as SvgElement)
  nodoTarget.parent().removeElement(nodoTarget)

  return foreignObject
}

/**
 * Busca el id dentro del svg y lo devuelve como nodo de svgdotjs
 */
function crearElem(svg: SVGElement, id: string) { 
  try {
    return SVG(svg.querySelector(`[id="${id}"]`))
  } catch { 
    throw new LdSvgError(`No se encuentra elemento con id ${id} dentro del SVG`)
  }
}

class LdSvgError extends Error { }