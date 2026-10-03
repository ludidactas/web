import { useCallback, useEffect, useState } from 'react'

interface ProgresoGuardado {
  resueltos: string[]
  /** Id del último desafío que el estudiante tenía abierto. */
  actual: string | null
}

export interface ProgresoDojo {
  resueltos: Set<string>
  /** Id del desafío en el que el estudiante quedó la última vez, o null si no hay nada guardado. */
  actualGuardado: string | null
  /** True una vez que se leyó el storage (en el cliente, después de montar). */
  cargado: boolean
  marcarResuelto: (id: string) => void
  guardarActual: (id: string | null) => void
}

function leer(clave: string): ProgresoGuardado {
  try {
    const crudo = localStorage.getItem(clave)
    if (!crudo) return { resueltos: [], actual: null }
    const datos = JSON.parse(crudo)
    return {
      resueltos: Array.isArray(datos?.resueltos) ? datos.resueltos.filter((x: unknown) => typeof x === 'string') : [],
      actual: typeof datos?.actual === 'string' ? datos.actual : null,
    }
  } catch {
    return { resueltos: [], actual: null }
  }
}

function escribir(clave: string, progreso: ProgresoGuardado) {
  try {
    localStorage.setItem(clave, JSON.stringify(progreso))
  } catch {
    // Storage lleno o bloqueado (modo privado): el progreso sigue vivo en memoria durante la sesión.
  }
}

/**
 * Progreso del dojo persistido en localStorage bajo `clave` (por dispositivo). Sin `clave` funciona
 * solo en memoria. El storage se lee después de montar para que el primer render coincida con el del server.
 */
export function useProgresoDojo(clave?: string): ProgresoDojo {
  const [resueltos, setResueltos] = useState<Set<string>>(new Set())
  const [actualGuardado, setActualGuardado] = useState<string | null>(null)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    if (!clave) return
    const guardado = leer(clave)
    setResueltos(new Set(guardado.resueltos))
    setActualGuardado(guardado.actual)
    setCargado(true)
  }, [clave])

  const marcarResuelto = useCallback(
    (id: string) => {
      setResueltos((prev) => {
        if (prev.has(id)) return prev
        const siguiente = new Set(prev).add(id)
        // Se relee el storage para no pisar el `actual` ni lo resuelto desde otra pestaña.
        if (clave) {
          const guardado = leer(clave)
          escribir(clave, { ...guardado, resueltos: [...new Set([...guardado.resueltos, id])] })
        }
        return siguiente
      })
    },
    [clave]
  )

  const guardarActual = useCallback(
    (id: string | null) => {
      if (!clave) return
      escribir(clave, { ...leer(clave), actual: id })
    },
    [clave]
  )

  return { resueltos, actualGuardado, cargado, marcarResuelto, guardarActual }
}
