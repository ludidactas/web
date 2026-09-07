export type ColeccionPreguntasEnDrive = {
  archivo: string
  contenido: string
}

/** Señaliza que el usuario todavía no autorizó (o le revocamos) el acceso a Drive. Mapea al 409 del servidor. */
export class DriveNoConectado extends Error {
  constructor() {
    super('Drive no está conectado')
    this.name = 'DriveNoConectado'
  }
}

function ruta(salaId: string) {
  return `/api/google/salas/${encodeURIComponent(salaId)}/colecciones`
}

/** fetch con manejo común de errores: 409 → `DriveNoConectado`, cualquier otro !ok → `Error` con el mensaje del server. */
async function pedir(url: string, init?: RequestInit) {
  const respuesta = await fetch(url, init)

  if (respuesta.status === 409) throw new DriveNoConectado()
  if (!respuesta.ok) {
    const { error } = await respuesta.json().catch(() => ({ error: null }))
    throw new Error(error ?? `La app respondió ${respuesta.status}`)
  }

  return respuesta
}

/** Lee las colecciones de preguntas que el profe guardó en su Drive para esta sala. */
export async function leerColecciones(salaId: string): Promise<ColeccionPreguntasEnDrive[]> {
  const respuesta = await pedir(ruta(salaId))
  const { colecciones } = await respuesta.json()
  return colecciones
}

/** Guarda (o sobrescribe, si ya existe una con el mismo nombre) una colección de preguntas en el Drive del profe. */
export async function guardarColeccion(salaId: string, nombreSala: string, nombre: string, contenido: string) {
  await pedir(ruta(salaId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreSala, nombre, contenido }),
  })
}
