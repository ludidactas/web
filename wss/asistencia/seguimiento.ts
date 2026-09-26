import { io } from '../server'
import * as db from '../salas/db'
import { evaluarClase } from './evaluacion'

// Cuánto esperamos desde que el profe se desconecta antes de evaluar: tolera un refresh, un cambio de
// pestaña o una caída breve de red sin partir la clase en dos. Es SÓLO una demora: la ventana
// evaluada termina en la salida del profe, no acá.
const ESPERA_PARA_CERRAR_MS = 20 * 60_000

// El registro de la clase (inicio/fin) y cuándo evaluarla viven en redis (`db.RegistroDeClase` y el
// sorted set de cierres programados), para sobrevivir a un restart. Acá en memoria solo vive el
// `setTimeout`; `reprogramarCierresPendientes` lo reconstruye al bootear el proceso.
const timersLocales = new Map<string, ReturnType<typeof setTimeout>>()

/** Cancela el timer local de cierre de la sala, si lo hay (la contraparte en redis es `db.cancelarCierreProgramado`). */
function cancelarTimerLocal(salaId: string) {
  const timer = timersLocales.get(salaId)
  if (!timer) return
  clearTimeout(timer)
  timersLocales.delete(salaId)
}

/** Arma el timer local que, al vencer, evalúa la clase. `ts` es el epoch ms en el que corresponde evaluar. */
function programarTimerLocal(salaId: string, ts: number) {
  cancelarTimerLocal(salaId)
  const demora = Math.max(0, ts - Date.now())
  timersLocales.set(
    salaId,
    setTimeout(() => {
      timersLocales.delete(salaId)
      evaluarYEncolarClase(salaId).catch((e) => console.error(`Error evaluando asistencia para sala ${salaId}:`, e))
    }, demora)
  )
}

/**
 * Anota que el profe abrió (o reabrió) la sala, y cancela el cierre programado si lo había: reabrir
 * una clase en curso (un refresh, una reconexión) conserva el `inicio` original, porque el log de
 * asistencia es el mismo y la ventana tiene que seguir cubriéndolo entero.
 */
export async function registrarApertura(salaId: string): Promise<void> {
  cancelarTimerLocal(salaId)
  await db.cancelarCierreProgramado(salaId)

  const registro = await db.getRegistroDeClase(salaId)
  await db.guardarRegistroDeClase(salaId, registro ? { ...registro, fin: null } : { inicio: Date.now(), fin: null })
}

/**
 * Indica si al profe le queda algún socket vivo en la sala, excluyendo `excluirSocketId`: así la
 * clase sigue abierta mientras el profe tenga otra pestaña conectada. Excluimos por id porque el
 * socket que se está desconectando puede seguir apareciendo en `fetchSockets` por un instante
 * (propagación del adapter).
 */
async function hayProfeConectado(salaId: string, excluirSocketId?: string) {
  const sockets = await io.in(`sala:${salaId}:profe`).fetchSockets()
  return sockets.some((s) => s.id !== excluirSocketId)
}

/**
 * Anota que el profe se desconectó y, si no le queda ninguna otra conexión en la sala, programa el
 * cierre: al cabo de la espera se evalúa la asistencia y la clase queda cerrada. Si vuelve antes (con
 * el mismo socket o con otro), `registrarApertura` cancela el cierre y la clase continúa.
 */
export async function registrarSalidaDelProfe(salaId: string, excluirSocketId?: string): Promise<void> {
  cancelarTimerLocal(salaId)
  await db.cancelarCierreProgramado(salaId)
  if (await hayProfeConectado(salaId, excluirSocketId)) return

  const registro = await db.getRegistroDeClase(salaId)
  if (!registro) return

  const fin = Date.now()
  await db.guardarRegistroDeClase(salaId, { ...registro, fin })

  const ts = fin + ESPERA_PARA_CERRAR_MS
  await db.programarCierreDeClase(salaId, ts)
  programarTimerLocal(salaId, ts)
}

/**
 * Cierra la clase: evalúa la asistencia de cada estudiante contra la ventana real de la clase, la
 * encola como pendiente de subir a Drive (la sube el FE cuando el profe vuelve a abrir la sala) y
 * borra el log de asistencia, que ya quedó resumido en lo encolado.
 *
 * La dispara únicamente el cierre programado: el timer local al vencer la espera, o
 * `reprogramarCierresPendientes` al bootear si el plazo ya venció.
 *
 * La fecha de la clase es la del INICIO: el cierre cae bastante después, y puede cruzar la medianoche.
 */
export async function evaluarYEncolarClase(salaId: string): Promise<void> {
  cancelarTimerLocal(salaId)
  await db.cancelarCierreProgramado(salaId)

  const registro = await db.getRegistroDeClase(salaId)
  // `fin === null`: el profe ya reabrió la sala, ganándole la carrera a esta evaluación (posible
  // tras un restart, contra `reprogramarCierresPendientes`). La clase sigue viva.
  if (!registro || registro.fin === null) return
  await db.borrarRegistroDeClase(salaId)

  const sala = await db.getSala(salaId)
  if (!sala) return

  const condicion = sala.config.condicion_asistencia
  if (!condicion) return

  const eventos = await db.getEventosAsistencia(salaId)
  if (eventos.length === 0) return

  const estudiantes = await db.getEstudiantes(salaId)
  const asistencia = evaluarClase(eventos, estudiantes, condicion, { inicio: registro.inicio, fin: registro.fin })
  if (!asistencia) return

  await db.encolarAsistencia(salaId, asistencia)
  await db.borrarLogDeAsistencia(salaId)

  const presentes = asistencia.estudiantes.filter((e) => e.presente).length
  console.log(`Asistencia evaluada para sala ${salaId}: ${presentes}/${asistencia.estudiantes.length} presentes`)
}

/**
 * Al bootear el proceso wss: relee de redis los cierres programados y arma sus timers de nuevo (los
 * `setTimeout` viven solo en memoria, así que un restart se los lleva). Si el plazo ya venció
 * mientras el proceso estuvo caído, evalúa la clase de una en vez de armar un timer con demora negativa.
 */
export async function reprogramarCierresPendientes(): Promise<void> {
  const pendientes = await db.getCierresProgramados()

  for (const { salaId, ts } of pendientes) {
    if (ts <= Date.now()) {
      await evaluarYEncolarClase(salaId).catch((e) =>
        console.error(`Error evaluando asistencia pendiente para sala ${salaId}:`, e)
      )
    } else {
      programarTimerLocal(salaId, ts)
    }
  }
}
