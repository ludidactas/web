/**
 * Piezas compartidas por los recursos del FE que pegan a las rutas propias de Google
 * (`/api/google/...`): `recursos-colecciones` y `recursos-asistencia`.
 */

/** Señaliza que el usuario todavía no autorizó (o le revocamos) el acceso a Drive. Mapea al 409 del servidor. */
export class DriveNoConectado extends Error {
  constructor() {
    super('Drive no está conectado')
    this.name = 'DriveNoConectado'
  }
}

/** fetch con manejo común de errores: 409 → `DriveNoConectado`, cualquier otro !ok → `Error` con el mensaje del server. */
export async function pedirGoogle(url: string, init?: RequestInit) {
  const respuesta = await fetch(url, init)

  if (respuesta.status === 409) throw new DriveNoConectado()
  if (!respuesta.ok) {
    const { error } = await respuesta.json().catch(() => ({ error: null }))
    throw new Error(error ?? `La app respondió ${respuesta.status}`)
  }

  return respuesta
}
