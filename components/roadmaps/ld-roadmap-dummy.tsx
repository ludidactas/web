import { ComponentProps, useCallback, useState, useRef, memo } from 'react'
import RoadmapDummy from '@/svg/dist/roadmap_dummy_2.svg'
import { LdSvg } from '../custom/ld-svg'

/**
 * Prueba de montaje de un roadmap usando el nuevo modelo de LdSvg <3
 * @returns
 */
function LdRoadmapDummy() {
  // Definimos los ids que queremos targetear - es decir que tiren error si no son encontrados
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lugares = ['uno', 'dos', 'tres', 'cuatro', 'cinco'] as const
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const caminos = ['dos-cuatro', 'cuatro-cinco', 'uno-cuatro', 'dos-tres', 'uno-dos', 'dos-cinco'] as const

  // Definimos la firma de los ids que queremos enforcear
  type Lugar = (typeof lugares)[number]
  type Camino = (typeof caminos)[number]
  type IdLugar = `nodo.${Lugar}` | `nodo.${Lugar}.${'activo' | 'inactivo'}`
  type IdCamino = `camino.${Camino}` | `camino.${Camino}.${'activo' | 'inactivo'}`
  type Id = IdLugar | IdCamino

  // Nodos activos
  const [activos, setActivos] = useState<Id[]>([])

  // Ref to store click handlers
  const clickHandlersRef = useRef<Map<string, () => void>>(new Map())

  // Flag para correr el setup una sola vez
  const setupCorrio = useRef(false)

  // Función setup
  const setup = useCallback<NonNullable<ComponentProps<typeof LdSvg<Id>>['setup']>>((nodos) => {
    if (setupCorrio.current) return

    Object.entries(nodos).forEach(([id, nodo]) => {
      // Ocultamos activos
      if (id.endsWith('.activo')) nodo.node.style.visibility = 'hidden'
      // Quitamos pointer events de las imágenes
      if (id.endsWith('.imagen')) nodo.node.style.pointerEvents = 'none'

      // Attacheamos event listeners a los nodos que empiezan con nodo.
      if (
        (id.startsWith('nodo.') || id.startsWith('camino.')) &&
        (id.endsWith('.activo') || id.endsWith('.inactivo'))
      ) {
        const parentId = nodo.parent()!.id() as Id

        // Create a handler that closes over the current parentId
        const handleClick = () => {
          console.log(`Click en `, parentId)
          setActivos((prev) => (prev.includes(parentId) ? prev.filter((i) => i !== parentId) : [...prev, parentId]))
        }

        // Guardamos el handler para mantenerlo entre renders
        clickHandlersRef.current.set(id, handleClick)

        // Lo attacheamos
        nodo.on('click', handleClick)
      }
    })

    setupCorrio.current = true
  }, []) // Empty dependency array

  const animation = useCallback<NonNullable<ComponentProps<typeof LdSvg<Id>>['animation']>>(
    (nodos) => {
      Object.entries(nodos).forEach(([id, nodo]) => {
        const parentId = nodo.parent()!.id() as Id

        // Si está activo, lo mostramos, corta
        if (id.startsWith('nodo.')) {
          const lugarActivo = activos.includes(parentId)
          if (id.endsWith('.activo')) {
            nodo.node.style.visibility = lugarActivo ? 'visible' : 'hidden'
          }
          if (id.endsWith('.inactivo')) {
            nodo.node.style.visibility = lugarActivo ? 'hidden' : 'visible'
          }
        }

        if (id.startsWith('camino.')) {
          const [desde, hasta] = id.split('.')[1].split('-') as [(typeof lugares)[number], (typeof lugares)[number]]
          const caminoActivo = activos.includes(`nodo.${desde}` as Id) && activos.includes(`nodo.${hasta}`)
          if (id.endsWith('.activo')) {
            nodo.node.style.visibility = caminoActivo ? 'visible' : 'hidden'
          }
          if (id.endsWith('.inactivo')) {
            nodo.node.style.visibility = caminoActivo ? 'hidden' : 'visible'
          }
        }
      })
    },
    [activos]
  )

  return <LdSvg SvgComponent={RoadmapDummy} ids={[] as Id[]} setup={setup} animation={animation} />
}

// Export a memoized version of the component
export default memo(LdRoadmapDummy)
