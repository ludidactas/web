import type { EventoAsistencia, IntervaloDeConexion } from '../salas/db'
import { FormaEvaluacionAsistencia, type CondicionAsistencia } from '../validators/asistencia'

/** La clase: desde que el profe abrió la sala (`inicio`) hasta que se desconectó (`fin`). */
export type VentanaDeClase = { inicio: number; fin: number }

/**
 * Reconstruye, por userId, los intervalos durante los que el estudiante estuvo conectado, a partir
 * del log crudo de eventos. Usa un contador de profundidad (conexiones simultáneas): un intervalo va
 * desde que la profundidad pasa de 0→1 hasta que vuelve a 0. Así multi-tab cuenta como un solo
 * intervalo, y un 'desconexion' que nunca llegó (ej: crash) queda como intervalo abierto (`fin: null`).
 */
export function reconstruirIntervalos(eventos: EventoAsistencia[]): Record<string, IntervaloDeConexion[]> {
  const ordenados = [...eventos].sort((a, b) => a.ts - b.ts)
  const intervalos: Record<string, IntervaloDeConexion[]> = {}
  const profundidad: Record<string, number> = {}

  for (const { userId, evento, ts } of ordenados) {
    const lista = (intervalos[userId] ??= [])
    const actual = profundidad[userId] ?? 0

    if (evento === 'conexion') {
      if (actual === 0) lista.push({ inicio: ts, fin: null })
      profundidad[userId] = actual + 1
    } else {
      profundidad[userId] = Math.max(0, actual - 1)
      const abierto = lista[lista.length - 1]
      if (profundidad[userId] === 0 && abierto && abierto.fin === null) abierto.fin = ts
    }
  }

  return intervalos
}

/** Cuánto estuvo conectado (en ms) dentro de `[desde, hasta]`, recortando lo que quede afuera. */
function msConectados(intervalos: IntervaloDeConexion[], desde: number, hasta: number): number {
  let total = 0
  for (const { inicio, fin } of intervalos) {
    const i = Math.max(inicio, desde)
    const f = Math.min(fin ?? hasta, hasta)
    if (f > i) total += f - i
  }
  return total
}

/**
 * Devuelve si el estudiante estuvo presente en la clase, según la condición de la sala.
 *
 * Los dos criterios se miden DENTRO de la ventana de la clase, y no contra `Date.now()`: la clase
 * termina cuando el profe se desconecta, y la espera previa a evaluar (ver `seguimiento.ts`) es sólo
 * una demora para tolerar un refresh, no tiempo de clase.
 */
export function estuvoPresente(
  intervalos: IntervaloDeConexion[],
  condicion: CondicionAsistencia,
  { inicio, fin }: VentanaDeClase
): boolean {
  const umbral = condicion.minutos_minimos * 60_000

  switch (condicion.forma_evaluacion) {
    case FormaEvaluacionAsistencia.TotalMinutos:
      return msConectados(intervalos, inicio, fin) >= umbral

    case FormaEvaluacionAsistencia.UltimosMinutos:
      return msConectados(intervalos, fin - umbral, fin) >= umbral
  }
}
