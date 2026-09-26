import { BLANCO, Color, NEGRO, Tablero, VACIO, vecinos } from '@/lib/go/motor'

/**
 * Algoritmo de Benson (1976): determina qué cadenas están "incondicionalmente vivas" — vivas sin
 * importar cuántas jugadas seguidas le regalemos al rival. Es determinístico (no heurístico): si
 * dice que una cadena está viva, está matemáticamente probado. La contraparte es que NO prueba
 * muerte: una cadena que no aparece acá puede estar realmente muerta, en disputa, o simplemente
 * todavía no reducida a la forma que el algoritmo reconoce.
 *
 * Definición (https://en.wikipedia.org/wiki/Benson%27s_algorithm_(Go)):
 * - X = todas las cadenas de un color.
 * - R = todas las regiones vacías "encerradas" por ese color (ninguna piedra rival las bordea).
 * - Una región de R es "vital" para una cadena de X si TODOS sus puntos vacíos son libertad de esa
 *   cadena (es decir, lindan con alguna piedra de esa cadena específica).
 * - Se repite hasta punto fijo:
 *     - Sacar de X las cadenas con menos de 2 regiones vitales en R.
 *     - Sacar de R las regiones que bordeen alguna piedra de una cadena que ya no está en X.
 * - Lo que queda en X son las cadenas incondicionalmente vivas.
 */

function clave(fila: number, columna: number): string {
  return `${fila},${columna}`
}

interface Cadena {
  id: number
  puntos: Set<string>
}

/** Todas las cadenas (grupos conectados) de un color. */
function calcularCadenas(tablero: Tablero, tamaño: number, color: Color): Cadena[] {
  const visitados = new Set<string>()
  const cadenas: Cadena[] = []

  for (let fila = 0; fila < tamaño; fila++) {
    for (let columna = 0; columna < tamaño; columna++) {
      if (tablero[fila][columna] !== color || visitados.has(clave(fila, columna))) continue

      const puntos = new Set<string>()
      const stack: Array<[number, number]> = [[fila, columna]]
      while (stack.length > 0) {
        const [cf, cc] = stack.pop()!
        const k = clave(cf, cc)
        if (visitados.has(k)) continue
        visitados.add(k)
        puntos.add(k)
        for (const [nf, nc] of vecinos(cf, cc, tamaño)) {
          if (tablero[nf][nc] === color && !visitados.has(clave(nf, nc))) stack.push([nf, nc])
        }
      }
      cadenas.push({ id: cadenas.length, puntos })
    }
  }

  return cadenas
}

/** Todas las regiones vacías (grupos conectados de puntos sin piedra) del tablero. */
function calcularRegionesVacias(tablero: Tablero, tamaño: number): Array<Set<string>> {
  const visitados = new Set<string>()
  const regiones: Array<Set<string>> = []

  for (let fila = 0; fila < tamaño; fila++) {
    for (let columna = 0; columna < tamaño; columna++) {
      if (tablero[fila][columna] !== VACIO || visitados.has(clave(fila, columna))) continue

      const puntos = new Set<string>()
      const stack: Array<[number, number]> = [[fila, columna]]
      while (stack.length > 0) {
        const [cf, cc] = stack.pop()!
        const k = clave(cf, cc)
        if (visitados.has(k)) continue
        visitados.add(k)
        puntos.add(k)
        for (const [nf, nc] of vecinos(cf, cc, tamaño)) {
          if (tablero[nf][nc] === VACIO && !visitados.has(clave(nf, nc))) stack.push([nf, nc])
        }
      }
      regiones.push(puntos)
    }
  }

  return regiones
}

/** ¿Ninguna piedra rival de `color` bordea esta región? (condición de "región encerrada"). */
function esRegionEncerradaPor(tablero: Tablero, tamaño: number, region: Set<string>, color: Color): boolean {
  for (const k of region) {
    const [fila, columna] = k.split(',').map(Number)
    for (const [nf, nc] of vecinos(fila, columna, tamaño)) {
      const v = tablero[nf][nc]
      if (v !== VACIO && v !== color) return false
    }
  }
  return true
}

/** ¿Todos los puntos de la región son libertad (vecino directo) de esta cadena en particular? */
function esVitalPara(tablero: Tablero, tamaño: number, region: Set<string>, cadena: Cadena, color: Color): boolean {
  for (const k of region) {
    const [fila, columna] = k.split(',').map(Number)
    const esLibertadDeLaCadena = vecinos(fila, columna, tamaño).some(
      ([nf, nc]) => tablero[nf][nc] === color && cadena.puntos.has(clave(nf, nc))
    )
    if (!esLibertadDeLaCadena) return false
  }
  return true
}

/** Devuelve las cadenas de `color` que están incondicionalmente vivas. */
function cadenasVivas(tablero: Tablero, tamaño: number, color: Color): Cadena[] {
  const cadenas = calcularCadenas(tablero, tamaño, color)
  if (cadenas.length === 0) return []

  let regiones = calcularRegionesVacias(tablero, tamaño).filter((r) => esRegionEncerradaPor(tablero, tamaño, r, color))
  const vivas = new Set(cadenas.map((c) => c.id))

  let cambio = true
  while (cambio) {
    cambio = false

    const regionesVitalesPorCadena = new Map<number, number>()
    for (const region of regiones) {
      for (const cadena of cadenas) {
        if (!vivas.has(cadena.id)) continue
        if (esVitalPara(tablero, tamaño, region, cadena, color)) {
          regionesVitalesPorCadena.set(cadena.id, (regionesVitalesPorCadena.get(cadena.id) ?? 0) + 1)
        }
      }
    }

    for (const cadena of cadenas) {
      if (vivas.has(cadena.id) && (regionesVitalesPorCadena.get(cadena.id) ?? 0) < 2) {
        vivas.delete(cadena.id)
        cambio = true
      }
    }

    const nuevasRegiones = regiones.filter((region) =>
      cadenas.every((cadena) => {
        if (vivas.has(cadena.id)) return true // cadena viva: no hace caer la región
        // cadena ya no viva: si la región la bordea, se cae
        for (const k of region) {
          const [fila, columna] = k.split(',').map(Number)
          const tocaEstaCadena = vecinos(fila, columna, tamaño).some(
            ([nf, nc]) => tablero[nf][nc] === color && cadena.puntos.has(clave(nf, nc))
          )
          if (tocaEstaCadena) return false
        }
        return true
      })
    )
    if (nuevasRegiones.length !== regiones.length) {
      regiones = nuevasRegiones
      cambio = true
    }
  }

  return cadenas.filter((c) => vivas.has(c.id))
}

/** Matriz `tamaño x tamaño`: `true` en cada punto que pertenece a una cadena incondicionalmente viva. */
export function calcularVivos(tablero: Tablero, tamaño: number): boolean[][] {
  const vivo = Array.from({ length: tamaño }, () => Array(tamaño).fill(false))

  for (const color of [NEGRO, BLANCO] as const) {
    for (const cadena of cadenasVivas(tablero, tamaño, color)) {
      for (const k of cadena.puntos) {
        const [fila, columna] = k.split(',').map(Number)
        vivo[fila][columna] = true
      }
    }
  }

  return vivo
}
