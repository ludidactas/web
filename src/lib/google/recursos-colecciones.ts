import { pedirGoogle } from './comun'

export type ColeccionPreguntasEnDrive = {
  archivo: string
  contenido: string
}

function ruta(salaId: string) {
  return `/api/google/salas/${encodeURIComponent(salaId)}/colecciones`
}

/** Lee las colecciones de preguntas que el profe guardó en su Drive para esta sala. */
export async function leerColecciones(salaId: string): Promise<ColeccionPreguntasEnDrive[]> {
  const respuesta = await pedirGoogle(ruta(salaId))
  const { colecciones } = await respuesta.json()
  return colecciones
}

/** Guarda (o sobrescribe, si ya existe una con el mismo nombre) una colección de preguntas en el Drive del profe. */
export async function guardarColeccion(salaId: string, nombreSala: string, nombre: string, contenido: string) {
  await pedirGoogle(ruta(salaId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreSala, nombre, contenido }),
  })
}
