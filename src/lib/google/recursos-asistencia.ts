import type { AsistenciaDeClase } from '@/wss/validators/asistencia'

import { pedirGoogle } from './comun'

/** Manda a escribir en la planilla de Drive de la sala las clases evaluadas que quedaron pendientes. */
export async function escribirAsistenciaEnDrive(salaId: string, nombreSala: string, asistencias: AsistenciaDeClase[]) {
  await pedirGoogle(`/api/google/salas/${encodeURIComponent(salaId)}/asistencia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreSala, asistencias }),
  })
}
