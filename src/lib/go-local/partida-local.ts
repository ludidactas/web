import { calcularVivos } from '@/lib/go/benson'
import type { ModoPartida } from '@/wss/validators/go'
import {
  calcularPuntaje,
  grupoEn,
  hashTablero,
  jugar,
  JugadaInvalida,
  NEGRO,
  rival,
  tableroAtari,
  tableroVacio,
  type Color,
  type Puntaje,
  type Tablero,
} from '@/lib/go/motor'

/**
 * Partida de Go entre dos personas en un mismo dispositivo (pass-and-play). Cada función recibe la
 * partida y devuelve la siguiente, sin mutar la anterior; las jugadas ilegales lanzan `JugadaInvalida`.
 * Las reglas son las de `@/lib/go/motor`, el mismo motor que usan el servidor de salas y el dojo.
 */

export type FasePartidaLocal = 'jugando' | 'contando' | 'terminada'

export interface PartidaLocal {
  tamaño: number
  /** `atari`: arranca con cuatro piedras en cruz en el centro, no se puede pasar y gana quien captura primero. */
  modo: ModoPartida
  tablero: Tablero
  turno: Color
  capturasNegras: number
  capturasBlancas: number
  pases: number
  /** Hashes de las posiciones ya vistas, para el ko. */
  historial: string[]
  ultimaJugada: { fila: number; columna: number } | null
  fase: FasePartidaLocal
  /** Piedras marcadas como muertas durante el conteo; `null` fuera de esa fase. */
  removidas: boolean[][] | null
  /** Cadenas incondicionalmente vivas (Benson), no marcables como muertas; `null` fuera del conteo. */
  vivo: boolean[][] | null
  /** Quiénes están conformes con el conteo actual. Cualquier cambio en el marcado los resetea. */
  confirmaron: { negro: boolean; blanco: boolean }
  resultado: Puntaje | null
}

export function nuevaPartidaLocal(tamaño: number, modo: ModoPartida = 'partida'): PartidaLocal {
  return {
    tamaño,
    modo,
    tablero: modo === 'atari' ? tableroAtari(tamaño) : tableroVacio(tamaño),
    turno: NEGRO,
    capturasNegras: 0,
    capturasBlancas: 0,
    pases: 0,
    historial: [],
    ultimaJugada: null,
    fase: 'jugando',
    removidas: null,
    vivo: null,
    confirmaron: { negro: false, blanco: false },
    resultado: null,
  }
}

function assertFase(partida: PartidaLocal, fase: FasePartidaLocal) {
  if (partida.fase !== fase) throw new JugadaInvalida('Esa acción no corresponde a esta fase de la partida')
}

export function jugarLocal(partida: PartidaLocal, fila: number, columna: number): PartidaLocal {
  assertFase(partida, 'jugando')
  const { tablero, capturas } = jugar(
    partida.tablero,
    partida.tamaño,
    fila,
    columna,
    partida.turno,
    new Set(partida.historial)
  )
  const juegaNegro = partida.turno === NEGRO
  const capturasNegras = partida.capturasNegras + (juegaNegro ? capturas : 0)
  const capturasBlancas = partida.capturasBlancas + (juegaNegro ? 0 : capturas)

  const siguiente: PartidaLocal = {
    ...partida,
    tablero,
    turno: rival(partida.turno),
    capturasNegras,
    capturasBlancas,
    pases: 0,
    historial: [...partida.historial, hashTablero(tablero)],
    ultimaJugada: { fila, columna },
  }
  if (partida.modo !== 'atari' || capturas === 0) return siguiente

  // Atari Go: la primera captura termina la partida; el resultado son las capturas de cada color.
  return {
    ...siguiente,
    fase: 'terminada',
    resultado: { negro: capturasNegras, blanco: capturasBlancas, ganador: juegaNegro ? 'negro' : 'blanco' },
  }
}

/** Dos pases seguidos terminan el juego y abren el conteo de piedras muertas. */
export function pasarLocal(partida: PartidaLocal): PartidaLocal {
  assertFase(partida, 'jugando')
  if (partida.modo === 'atari') throw new JugadaInvalida('En Atari Go no se puede pasar')
  const pases = partida.pases + 1
  const siguiente = { ...partida, pases, turno: rival(partida.turno) }
  if (pases < 2) return siguiente

  return {
    ...siguiente,
    fase: 'contando',
    removidas: partida.tablero.map((fila) => fila.map(() => false)),
    vivo: calcularVivos(partida.tablero, partida.tamaño),
    confirmaron: { negro: false, blanco: false },
  }
}

/** Marca como muerto (o restaura) el grupo en (fila, columna) durante el conteo. */
export function marcarMuertaLocal(partida: PartidaLocal, fila: number, columna: number): PartidaLocal {
  assertFase(partida, 'contando')
  const grupo = grupoEn(partida.tablero, fila, columna, partida.tamaño)
  if (grupo.length === 0) throw new JugadaInvalida('Ahí no hay ninguna piedra')
  if (partida.vivo?.[fila][columna]) throw new JugadaInvalida('Ese grupo está incondicionalmente vivo')

  const removidas = partida.removidas!.map((f) => [...f])
  const marcar = !removidas[fila][columna]
  for (const [gf, gc] of grupo) removidas[gf][gc] = marcar
  return { ...partida, removidas, confirmaron: { negro: false, blanco: false } }
}

export function puntajeLocal(partida: PartidaLocal): Puntaje {
  return calcularPuntaje(
    partida.tablero,
    partida.tamaño,
    partida.removidas,
    partida.capturasNegras,
    partida.capturasBlancas
  )
}

/** Alterna la conformidad de `color` con el conteo; la partida termina cuando ambos están conformes. */
export function alternarConformidadLocal(partida: PartidaLocal, color: Color): PartidaLocal {
  assertFase(partida, 'contando')
  const clave = color === NEGRO ? 'negro' : 'blanco'
  const confirmaron = { ...partida.confirmaron, [clave]: !partida.confirmaron[clave] }
  const conformes = { ...partida, confirmaron }
  if (!(confirmaron.negro && confirmaron.blanco)) return conformes

  return { ...conformes, fase: 'terminada', resultado: puntajeLocal(partida) }
}
