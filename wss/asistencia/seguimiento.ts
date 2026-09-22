import { io } from '../server'
import * as db from '../salas/db'
import { estuvoPresente, reconstruirIntervalos, type VentanaDeClase } from './evaluacion'

// Cuánto esperamos desde que el profe se desconecta antes de evaluar: tolera un refresh, un cambio de
// pestaña o una caída breve de red sin partir la clase en dos. Es SÓLO una demora: la ventana
// evaluada termina en la salida del profe, no acá.
const ESPERA_PARA_CERRAR_MS = 20 * 60_000

/**
 * Lo que sabemos de la clase abierta de una sala: cuándo la vimos abrir (`inicio`) y cuándo se fue el
 * profe (`fin`). `inicio: null` = no la vimos empezar (p. ej. se reinició el wss); `fin: null` = el
 * profe todavía está adentro. Son las dos mismas puntas que `VentanaDeClase`, pero acá pueden faltar.
 */
type RegistroDeClase = { inicio: number | null; fin: number | null }

const registrosPorSala = new Map<string, RegistroDeClase>()
const cierresProgramados = new Map<string, ReturnType<typeof setTimeout>>()

/** Cancela el cierre programado de la sala, si lo hay */
function cancelarCierreProgramado(salaId: string) {
  const timer = cierresProgramados.get(salaId)
  if (!timer) return
  clearTimeout(timer)
  cierresProgramados.delete(salaId)
}

/**
 * Anota que el profe abrió (o reabrió) la sala, y cancela el cierre programado si lo había: reabrir
 * una clase en curso (un refresh, una reconexión) NO reinicia el inicio, porque el log de asistencia
 * es el mismo y la ventana tiene que seguir cubriéndolo entero.
 */
export function registrarApertura(salaId: string) {
  cancelarCierreProgramado(salaId)

  const registro = registrosPorSala.get(salaId)
  if (registro) registro.fin = null
  else registrosPorSala.set(salaId, { inicio: Date.now(), fin: null })
}

/**
 * Indica si al profe le queda algún socket vivo en la sala, excluyendo `excluirSocketId`: la clase
 * NO se cierra si el profe sigue presente en otra pestaña. Excluimos por id porque el socket que se
 * está desconectando puede seguir apareciendo en `fetchSockets` por un instante (propagación del adapter).
 */
async function hayProfeConectado(salaId: string, excluirSocketId?: string) {
  const sockets = await io.in(`sala:${salaId}:profe`).fetchSockets()
  return sockets.some((s) => s.id !== excluirSocketId)
}

/** Programa la evaluación de la clase para dentro de `ESPERA_PARA_CERRAR_MS`. */
function programarCierreDeClase(salaId: string) {
  cierresProgramados.set(
    salaId,
    setTimeout(() => {
      cierresProgramados.delete(salaId)
      evaluarYEncolarClase(salaId).catch((e) => console.error(`Error evaluando asistencia para sala ${salaId}:`, e))
    }, ESPERA_PARA_CERRAR_MS)
  )
}

/**
 * Anota que el profe se desconectó y, si no le queda ninguna otra conexión en la sala, programa el
 * cierre: al cabo de la espera se evalúa la asistencia y la clase queda cerrada. Si vuelve antes (con
 * el mismo socket o con otro), `registrarApertura` cancela el cierre y la clase continúa.
 */
export async function registrarSalidaDelProfe(salaId: string, excluirSocketId?: string) {
  cancelarCierreProgramado(salaId)
  if (await hayProfeConectado(salaId, excluirSocketId)) return

  const registro = registrosPorSala.get(salaId) ?? { inicio: null, fin: null }
  registro.fin = Date.now()
  registrosPorSala.set(salaId, registro)

  programarCierreDeClase(salaId)
}

/**
 * Cierra la clase: evalúa la asistencia de cada estudiante contra la ventana real de la clase, la
 * encola como pendiente de subir a Drive (la sube el FE cuando el profe vuelve a abrir la sala) y
 * borra el log de asistencia, que ya quedó resumido en lo encolado.
 *
 * No la llama el profe: la dispara el cierre programado cuando vence la espera.
 *
 * La fecha de la clase es la del INICIO: el cierre cae bastante después, y puede cruzar la medianoche.
 */
async function evaluarYEncolarClase(salaId: string) {
  const registro = registrosPorSala.get(salaId)
  registrosPorSala.delete(salaId)

  const sala = await db.getSala(salaId)
  if (!sala) return

  const condicion = sala.config.condicion_asistencia
  if (!condicion) return

  const eventos = await db.getEventosAsistencia(salaId)
  if (eventos.length === 0) return

  const intervalos = reconstruirIntervalos(eventos)
  const estudiantes = await db.getEstudiantes(salaId)

  const ventana: VentanaDeClase = {
    inicio: registro?.inicio ?? Math.min(...eventos.map((e) => e.ts)),
    fin: registro?.fin ?? Date.now(),
  }

  const DURACION_MINIMA_CLASE_MS = 30 * 60_000
  if (ventana.fin - ventana.inicio < DURACION_MINIMA_CLASE_MS) return

  const evaluados = Object.values(estudiantes).map((est) => ({
    userId: est.userId,
    nombre: est.nombre || est.userId,
    presente: estuvoPresente(intervalos[est.userId] ?? [], condicion, ventana),
  }))

  await db.encolarAsistencia(salaId, { inicio: ventana.inicio, fin: ventana.fin, estudiantes: evaluados })
  await db.borrarLogDeAsistencia(salaId)

  console.log(
    `Asistencia evaluada para sala ${salaId}: ${evaluados.filter((e) => e.presente).length}/${evaluados.length} presentes`
  )
}
