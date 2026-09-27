import { Queue, Worker } from 'bullmq'
import { io } from '../server'
import * as db from '../salas/db'
import { redisBullMQ } from '../redis'
import { evaluarClase } from './evaluacion'

// Cuánto esperamos desde que el profe se desconecta antes de evaluar: tolera un refresh, un cambio de
// pestaña o una caída breve de red sin partir la clase en dos. Es SÓLO una demora: la ventana
// evaluada termina en la salida del profe, no acá.
const ESPERA_PARA_CERRAR_MS = 20 * 60_000

const NOMBRE_COLA = 'asistencia-cierres'

/**
 * Cola de cierres de clase programados: job id = salaId (a lo sumo un cierre pendiente por sala, y
 * permite cancelarlo por id sin trackear nada aparte), delay = `ESPERA_PARA_CERRAR_MS`. Vive en redis:
 * sobrevive un restart del proceso wss sin código de reconciliación propio — el Worker, al arrancar,
 * procesa solo los jobs demorados que ya vencieron.
 */
const cierresProgramados = new Queue<{ salaId: string }>(NOMBRE_COLA, {
  connection: redisBullMQ,
  defaultJobOptions: { removeOnComplete: true, removeOnFail: { count: 50 } },
})

/** Cancela el job de cierre pendiente de la sala, si lo hay. */
async function cancelarJobDeCierre(salaId: string): Promise<void> {
  const job = await cierresProgramados.getJob(salaId)
  try {
    await job?.remove()
  } catch {
    console.log(`Intentando cancelar un job ya retomado o ya cancelado. No es necesario hacer nada más.`)
  }
}

/**
 * Anota que el profe abrió (o reabrió) la sala, y cancela el cierre programado si lo había: reabrir
 * una clase en curso (un refresh, una reconexión) conserva el `inicio` original, porque el log de
 * asistencia es el mismo y la ventana tiene que seguir cubriéndolo entero.
 */
export async function registrarApertura(salaId: string): Promise<void> {
  await cancelarJobDeCierre(salaId)

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
  await cancelarJobDeCierre(salaId)
  if (await hayProfeConectado(salaId, excluirSocketId)) return

  const registro = await db.getRegistroDeClase(salaId)
  if (!registro) return

  const fin = Date.now()
  await db.guardarRegistroDeClase(salaId, { ...registro, fin })

  await cierresProgramados.add('cierre', { salaId }, { jobId: salaId, delay: ESPERA_PARA_CERRAR_MS })
}

/**
 * Cierra la clase: evalúa la asistencia de cada estudiante contra la ventana real de la clase, la
 * encola como pendiente de subir a Drive (la sube el FE cuando el profe vuelve a abrir la sala) y
 * borra el log de asistencia, que ya quedó resumido en lo encolado.
 *
 * La dispara únicamente el Worker de `cierresProgramados`, cuando vence la espera.
 *
 * La fecha de la clase es la del INICIO: el cierre cae bastante después, y puede cruzar la medianoche.
 */
export async function evaluarYEncolarClase(salaId: string): Promise<void> {
  const registro = await db.getRegistroDeClase(salaId)
  // `fin === null`: el profe ya reabrió la sala, ganándole la carrera a esta evaluación (el único
  // camino es que `cancelarJobDeCierre` haya llegado tarde). La clase sigue viva.
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
 * Procesa los cierres vencidos. Un solo proceso wss, así que un solo Worker; si el día de mañana hay
 * más de una instancia, bullmq reparte los jobs entre los Workers activos sin cambios acá.
 */
const worker = new Worker<{ salaId: string }>(NOMBRE_COLA, (job) => evaluarYEncolarClase(job.data.salaId), {
  connection: redisBullMQ,
})

worker.on('failed', (job, err) => console.error(`Error evaluando asistencia para sala ${job?.data.salaId}:`, err))

/** Solo para tests: el job de cierre pendiente de la sala, si lo hay. */
export async function getJobDeCierrePendiente(salaId: string) {
  return cierresProgramados.getJob(salaId)
}
