import { AccesoSala, MetodosLogin } from '@/wss/validators/auth'
import type { ConfigSala, PlanillaCompleta } from '@/wss/validators/salas'

/**
 * Columnas y filas de la planilla completa, según la identidad y el acceso de la sala:
 * - `Nombre` solo si la identidad no es el nombre (ahí el ID ya es el nombre).
 * - `Nombre provisto` y `Asistió` solo si la sala usa lista; `Asistió: No` marca a quienes figuran en la
 *   lista y no ingresaron (o no estuvieron en la ventana pedida).
 */
export function armarTablaPlanilla(planilla: PlanillaCompleta, config: ConfigSala) {
  const usaLista = config.acceso !== AccesoSala.Libre

  const columnas = [
    { key: 'id', header: 'ID' },
    ...(config.metodo_login === MetodosLogin.Nombre ? [] : [{ key: 'nombre', header: 'Nombre' }]),
    ...(usaLista
      ? [
          { key: 'nombreProvisto', header: 'Nombre provisto' },
          { key: 'asistio', header: 'Asistió' },
        ]
      : []),
    ...planilla.preguntas.map((pregunta) => ({ key: pregunta.id, header: pregunta.pregunta })),
  ]

  const filas = planilla.filas.map((fila) => ({
    id: fila.dni || fila.email || fila.userId,
    nombre: fila.asistio ? fila.nombre || 'Sin nombre' : '',
    nombreProvisto: fila.nombreProvisto || '',
    asistio: fila.asistio ? 'Sí' : 'No',
    ...fila.respuestas,
  }))

  return { columnas, filas }
}
