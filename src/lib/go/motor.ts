/**
 * Motor de reglas de Go — único lugar donde vive esto, para el server y para el dojo de ejercicios.
 * Captura/autocaptura/ko, territorio y puntaje se resuelven a mano (flood-fill sobre una matriz plana,
 * algoritmos chicos y bien acotados): sin dependencias externas, este módulo es liviano y
 * determinístico, así que server, cliente (partida en vivo) y dojo lo importan directo — la
 * previsualización en vivo del conteo (cliente) usa la misma función que el resultado final que
 * confirma el server, así que por construcción nunca pueden dar números distintos.
 *
 * `jugar`, `calcularTerritorio` y `calcularPuntaje` necesitan historial de jugadas (para el ko) o "la
 * partida completa" (para contar) — el dojo arma su propio tablero desde la lista de piedras del
 * desafío y llama directo a `capturasEnJugada`/`grupoYLibertades` (ver
 * src/lib/go-dojo/motor-desafio.ts).
 */

export const VACIO = '.'
export const NEGRO = 'N'
export const BLANCO = 'B'

export type Color = typeof NEGRO | typeof BLANCO
export type Casilla = typeof VACIO | Color
export type Tablero = Casilla[][]

/** Un punto del tablero como (fila, columna) — la convención que usa todo este módulo, la misma con
 * la que `Tablero` está indexado (`tablero[fila][columna]`). */
export type Punto = [fila: number, columna: number]

export const rival = (color: Color): Color => (color === NEGRO ? BLANCO : NEGRO)

export function tableroVacio(tamaño: number): Tablero {
  return Array.from({ length: tamaño }, () => Array(tamaño).fill(VACIO))
}

function clonar(tablero: Tablero): Tablero {
  return tablero.map((fila) => [...fila])
}

export function vecinos(fila: number, columna: number, tamaño: number): Punto[] {
  const pts: Punto[] = []
  if (fila > 0) pts.push([fila - 1, columna])
  if (fila < tamaño - 1) pts.push([fila + 1, columna])
  if (columna > 0) pts.push([fila, columna - 1])
  if (columna < tamaño - 1) pts.push([fila, columna + 1])
  return pts
}

export interface GrupoYLibertades {
  grupo: Punto[]
  tieneLibertad: boolean
}

/** El grupo conectado (mismo color) a (fila,columna) y si le queda alguna libertad. */
export function grupoYLibertades(tablero: Tablero, fila: number, columna: number, tamaño: number): GrupoYLibertades {
  const color = tablero[fila][columna]
  const grupo: Punto[] = []
  const visitados = new Set<string>()
  const stack: Punto[] = [[fila, columna]]
  let tieneLibertad = false

  while (stack.length > 0) {
    const [cf, cc] = stack.pop()!
    const key = `${cf},${cc}`
    if (visitados.has(key)) continue
    visitados.add(key)
    grupo.push([cf, cc])

    for (const [nf, nc] of vecinos(cf, cc, tamaño)) {
      const v = tablero[nf][nc]
      if (v === VACIO) tieneLibertad = true
      else if (v === color && !visitados.has(`${nf},${nc}`)) stack.push([nf, nc])
    }
  }

  return { grupo, tieneLibertad }
}

/**
 * Piedras rivales capturadas al tener `color` ya puesto en (fila,columna) — asume que
 * `tablero[fila][columna] === color` (el caller ya aplicó la jugada sobre su propia copia de
 * trabajo). Pura: no muta `tablero`.
 */
export function capturasEnJugada(tablero: Tablero, fila: number, columna: number, color: Color, tamaño: number): Punto[] {
  const capturadas: Punto[] = []
  const yaCapturado = new Set<string>()

  for (const [nf, nc] of vecinos(fila, columna, tamaño)) {
    const key = `${nf},${nc}`
    if (tablero[nf][nc] !== rival(color) || yaCapturado.has(key)) continue
    const { grupo, tieneLibertad } = grupoYLibertades(tablero, nf, nc, tamaño)
    if (!tieneLibertad) {
      for (const [gf, gc] of grupo) {
        capturadas.push([gf, gc])
        yaCapturado.add(`${gf},${gc}`)
      }
    }
  }

  return capturadas
}

export function hashTablero(tablero: Tablero): string {
  return tablero.map((fila) => fila.join('')).join('/')
}

export class JugadaInvalida extends Error {}

export interface ResultadoJugada {
  tablero: Tablero
  capturas: number
}

/**
 * Aplica una jugada de `color` en (fila,columna). Lanza `JugadaInvalida` si la posición está ocupada,
 * es una autocaptura, o repite una posición anterior de la partida (ko / superko posicional vía
 * `historial`).
 */
export function jugar(
  tablero: Tablero,
  tamaño: number,
  fila: number,
  columna: number,
  color: Color,
  historial: ReadonlySet<string>
): ResultadoJugada {
  if (fila < 0 || fila >= tamaño || columna < 0 || columna >= tamaño)
    throw new JugadaInvalida('Posición fuera del tablero')
  if (tablero[fila][columna] !== VACIO) throw new JugadaInvalida('Esa posición ya tiene una piedra')

  const nuevo = clonar(tablero)
  nuevo[fila][columna] = color

  // Capturamos los grupos rivales que se hayan quedado sin libertades.
  const capturadas = capturasEnJugada(nuevo, fila, columna, color, tamaño)
  for (const [gf, gc] of capturadas) nuevo[gf][gc] = VACIO
  const capturas = capturadas.length

  // Autocaptura: si mi propio grupo quedó sin libertades y no capturé nada, es ilegal.
  const { tieneLibertad: miGrupoVive } = grupoYLibertades(nuevo, fila, columna, tamaño)
  if (!miGrupoVive) throw new JugadaInvalida('Jugada de autocaptura')

  const hash = hashTablero(nuevo)
  if (historial.has(hash)) throw new JugadaInvalida('Esa jugada repite una posición anterior de la partida (ko)')

  return { tablero: nuevo, capturas }
}

/** Grupo conectado a (fila,columna), para la fase de marcado de piedras muertas. */
export function grupoEn(tablero: Tablero, fila: number, columna: number, tamaño: number): Punto[] {
  if (fila < 0 || fila >= tamaño || columna < 0 || columna >= tamaño) return []
  if (tablero[fila][columna] === VACIO) return []
  return grupoYLibertades(tablero, fila, columna, tamaño).grupo
}

export interface Puntaje {
  negro: number
  blanco: number
  ganador: 'negro' | 'blanco' | 'empate'
}

export const KOMI_POR_TAMAÑO: Record<number, number> = { 9: 5.5, 13: 6.5, 19: 7.5 }

/** Territorio neutral (bordeado por ambos colores a la vez). */
export const DAME = '?'

/** `VACIO` = no es territorio (piedra viva en pie), un `Color` = territorio de ese color, `DAME` = neutral. */
export type ColorTerritorio = typeof VACIO | Color | typeof DAME

/**
 * Flood-fill de las regiones vacías del tablero (tratando las piedras marcadas muertas en `removidas`
 * como si ya hubieran sido retiradas). Una región es de un color si todas las piedras vivas que la
 * bordean son de ese color; si la bordean ambos colores, es neutral (dame).
 */
export function calcularTerritorio(tablero: Tablero, removidas: boolean[][] | null | undefined, tamaño: number) {
  const territorio: ColorTerritorio[][] = Array.from({ length: tamaño }, () => Array(tamaño).fill(VACIO))
  if (!removidas) return territorio

  const esVacio = (fila: number, columna: number) => tablero[fila][columna] === VACIO || removidas[fila][columna]
  const visitado = Array.from({ length: tamaño }, () => Array(tamaño).fill(false))

  for (let fila = 0; fila < tamaño; fila++) {
    for (let columna = 0; columna < tamaño; columna++) {
      if (visitado[fila][columna] || !esVacio(fila, columna)) continue

      const region: Punto[] = []
      const bordes = new Set<Color>()
      const stack: Punto[] = [[fila, columna]]
      visitado[fila][columna] = true

      while (stack.length > 0) {
        const [cf, cc] = stack.pop()!
        region.push([cf, cc])

        for (const [nf, nc] of vecinos(cf, cc, tamaño)) {
          if (!esVacio(nf, nc)) {
            bordes.add(tablero[nf][nc] as Color)
            continue
          }
          if (visitado[nf][nc]) continue
          visitado[nf][nc] = true
          stack.push([nf, nc])
        }
      }

      const dueño: ColorTerritorio = bordes.size === 1 ? [...bordes][0] : DAME
      for (const [rf, rc] of region) territorio[rf][rc] = dueño
    }
  }

  return territorio
}

/**
 * Puntaje "de mesa" (estilo japonés): territorio (espacios vacíos rodeados por un único color,
 * incluidos los que libera marcar una piedra como muerta) menos las capturas que hizo el rival
 * durante la partida, más komi para blanco — no cuenta las piedras propias en pie, así se cuenta a
 * mano en el club. Usada tanto para el resultado final (server) como para la previsualización en vivo
 * durante el conteo (cliente): al ser la misma función, nunca pueden dar números distintos.
 */
export function calcularPuntaje(
  tablero: Tablero,
  tamaño: number,
  removidas: boolean[][] | null | undefined,
  capturasNegras: number,
  capturasBlancas: number
): Puntaje {
  const territorio = calcularTerritorio(tablero, removidas, tamaño)
  let territorioNegro = 0
  let territorioBlanco = 0

  for (let y = 0; y < tamaño; y++) {
    for (let x = 0; x < tamaño; x++) {
      if (territorio[y][x] === NEGRO) territorioNegro++
      else if (territorio[y][x] === BLANCO) territorioBlanco++
    }
  }

  const komi = KOMI_POR_TAMAÑO[tamaño] ?? 7.5
  const negro = territorioNegro - capturasBlancas
  const blanco = territorioBlanco - capturasNegras + komi

  return {
    negro,
    blanco,
    ganador: negro === blanco ? 'empate' : negro > blanco ? 'negro' : 'blanco',
  }
}
