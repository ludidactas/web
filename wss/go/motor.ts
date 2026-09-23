/**
 * Motor de reglas de Go. Captura/suicidio/ko, territorio y puntaje se resuelven a mano (flood-fill
 * sobre una matriz plana, algoritmos chicos y bien acotados): sin dependencias externas, este módulo
 * es liviano y determinístico, así que tanto el server como el cliente lo importan directo — el
 * cliente lo usa para la previsualización en vivo del conteo, que por construcción da exactamente el
 * mismo número que el resultado final que confirma el server.
 */

export const VACIO = 0
export const NEGRO = 1
export const BLANCO = 2

export type Color = typeof NEGRO | typeof BLANCO
export type Tablero = number[][]

export const rival = (color: Color): Color => (color === NEGRO ? BLANCO : NEGRO)

export function tableroVacio(tamaño: number): Tablero {
  return Array.from({ length: tamaño }, () => Array(tamaño).fill(VACIO))
}

function clonar(tablero: Tablero): Tablero {
  return tablero.map((fila) => [...fila])
}

function vecinos(x: number, y: number, tamaño: number): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  if (x > 0) pts.push([x - 1, y])
  if (x < tamaño - 1) pts.push([x + 1, y])
  if (y > 0) pts.push([x, y - 1])
  if (y < tamaño - 1) pts.push([x, y + 1])
  return pts
}

/** Devuelve el grupo conectado (mismo color) a (x,y) y si le queda alguna libertad. */
function grupoYLibertades(tablero: Tablero, x: number, y: number, tamaño: number) {
  const color = tablero[y][x]
  const grupo: Array<[number, number]> = []
  const visitados = new Set<string>()
  const stack: Array<[number, number]> = [[x, y]]
  let tieneLibertad = false

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!
    const key = `${cx},${cy}`
    if (visitados.has(key)) continue
    visitados.add(key)
    grupo.push([cx, cy])

    for (const [nx, ny] of vecinos(cx, cy, tamaño)) {
      const v = tablero[ny][nx]
      if (v === VACIO) tieneLibertad = true
      else if (v === color && !visitados.has(`${nx},${ny}`)) stack.push([nx, ny])
    }
  }

  return { grupo, tieneLibertad }
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
 * Aplica una jugada de `color` en (x,y). Lanza `JugadaInvalida` si la posición está ocupada, es
 * suicida, o repite una posición anterior de la partida (ko / superko posicional vía `historial`).
 */
export function jugar(
  tablero: Tablero,
  tamaño: number,
  x: number,
  y: number,
  color: Color,
  historial: ReadonlySet<string>
): ResultadoJugada {
  if (x < 0 || x >= tamaño || y < 0 || y >= tamaño) throw new JugadaInvalida('Posición fuera del tablero')
  if (tablero[y][x] !== VACIO) throw new JugadaInvalida('Esa posición ya tiene una piedra')

  const nuevo = clonar(tablero)
  nuevo[y][x] = color

  // Capturamos los grupos rivales que se hayan quedado sin libertades.
  let capturas = 0
  for (const [nx, ny] of vecinos(x, y, tamaño)) {
    if (nuevo[ny][nx] !== rival(color)) continue
    const { grupo, tieneLibertad } = grupoYLibertades(nuevo, nx, ny, tamaño)
    if (!tieneLibertad) {
      for (const [gx, gy] of grupo) nuevo[gy][gx] = VACIO
      capturas += grupo.length
    }
  }

  // Suicidio: si mi propio grupo quedó sin libertades y no capturé nada, es ilegal.
  const { tieneLibertad: miGrupoVive } = grupoYLibertades(nuevo, x, y, tamaño)
  if (!miGrupoVive) throw new JugadaInvalida('Jugada suicida')

  const hash = hashTablero(nuevo)
  if (historial.has(hash)) throw new JugadaInvalida('Esa jugada repite una posición anterior de la partida (ko)')

  return { tablero: nuevo, capturas }
}

/** Grupo conectado a (x,y), para la fase de marcado de piedras muertas. */
export function grupoEn(tablero: Tablero, x: number, y: number, tamaño: number): Array<[number, number]> {
  if (x < 0 || x >= tamaño || y < 0 || y >= tamaño) return []
  if (tablero[y][x] === VACIO) return []
  return grupoYLibertades(tablero, x, y, tamaño).grupo
}

export interface Puntaje {
  negro: number
  blanco: number
  ganador: 'negro' | 'blanco' | 'empate'
}

export const KOMI_POR_TAMAÑO: Record<number, number> = { 9: 5.5, 13: 6.5, 19: 7.5 }

/** 0 = no es territorio (piedra viva en pie), 1/2 = territorio de ese color, 3 = neutral (dame). */
export type ColorTerritorio = 0 | 1 | 2 | 3

/**
 * Flood-fill de las regiones vacías del tablero (tratando las piedras marcadas muertas en `removidas`
 * como si ya hubieran sido retiradas). Una región es de un color si todas las piedras vivas que la
 * bordean son de ese color; si la bordean ambos colores, es neutral (dame).
 */
export function calcularTerritorio(tablero: Tablero, removidas: boolean[][] | null | undefined, tamaño: number) {
  const territorio: ColorTerritorio[][] = Array.from({ length: tamaño }, () => Array(tamaño).fill(0))
  if (!removidas) return territorio

  const esVacio = (x: number, y: number) => tablero[y][x] === VACIO || removidas[y][x]
  const visitado = Array.from({ length: tamaño }, () => Array(tamaño).fill(false))

  for (let y = 0; y < tamaño; y++) {
    for (let x = 0; x < tamaño; x++) {
      if (visitado[y][x] || !esVacio(x, y)) continue

      const region: Array<[number, number]> = []
      const bordes = new Set<number>()
      const stack: Array<[number, number]> = [[x, y]]
      visitado[y][x] = true

      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!
        region.push([cx, cy])

        for (const [nx, ny] of vecinos(cx, cy, tamaño)) {
          if (!esVacio(nx, ny)) {
            bordes.add(tablero[ny][nx])
            continue
          }
          if (visitado[ny][nx]) continue
          visitado[ny][nx] = true
          stack.push([nx, ny])
        }
      }

      const dueño: ColorTerritorio = bordes.size === 1 ? ([...bordes][0] as ColorTerritorio) : 3
      for (const [rx, ry] of region) territorio[ry][rx] = dueño
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
