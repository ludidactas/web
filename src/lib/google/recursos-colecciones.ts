export type ColeccionPreguntasEnDrive = {
  archivo: string
  contenido: string
}

export class DriveNoConectado extends Error {
  constructor() {
    super('Drive no está conectado')
    this.name = 'DriveNoConectado'
  }
}

function ruta(salaId: string) {
  return `/api/google/salas/${encodeURIComponent(salaId)}/colecciones`
}

async function pedir(url: string, init?: RequestInit) {
  const respuesta = await fetch(url, init)

  if (respuesta.status === 409) throw new DriveNoConectado()
  if (!respuesta.ok) {
    const { error } = await respuesta.json().catch(() => ({ error: null }))
    throw new Error(error ?? `La app respondió ${respuesta.status}`)
  }

  return respuesta
}

export async function leerColecciones(salaId: string): Promise<ColeccionPreguntasEnDrive[]> {
  const respuesta = await pedir(ruta(salaId))
  const { colecciones } = await respuesta.json()
  return colecciones
}

export async function guardarColeccion(salaId: string, nombreSala: string, nombre: string, contenido: string) {
  await pedir(ruta(salaId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreSala, nombre, contenido }),
  })
}
