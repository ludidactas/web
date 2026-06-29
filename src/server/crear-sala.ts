'use server'

import { auth } from '@/app/auth'
import { randomUUID } from 'crypto'
import { mergeDeep } from 'remeda'
import { MetodosLogin } from '@/wss/validators/auth'
import type { ConfigCreacionSala } from '@/wss/validators/salas'
import * as salaDb from '@/wss/salas/db'
import * as invitadosDb from '@/wss/invitados/db'
// LÍMITE SUSCRIPCIÓN (desactivado): reactivar este import junto con la llamada de abajo.
// import { assertPuedeCrearSala } from '@/wss/suscripciones/planes'

export async function crearSala(
  config: ConfigCreacionSala,
  listaPermitidos: string[] = [],
  nombreSala?: string
): Promise<string> {
  const session = await auth()
  if (!session?.user?.email) throw new Error('No autenticado')

  const email = session.user.email
  const nombre = session.user.name || email

  // LÍMITE SUSCRIPCIÓN (desactivado): compuerta freemium. Reactivar cuando exista la suscripción.
  // await assertPuedeCrearSala(email)

  const id = randomUUID().split('-')[0]

  const configDefault = {
    metodo_login: MetodosLogin.Nombre,
    link: '',
    nombre_profe: email,
    solo_invitados: false,
  }

  const configFinal = mergeDeep(configDefault, {
    nombre_profe: nombre,
    ...(nombreSala ? { nombre: nombreSala } : {}),
    ...config,
  }) as typeof configDefault & { nombre?: string }

  await salaDb.guardarSala({
    id,
    profe: { email, nombre },
    config: { ...configFinal, link: `${process.env.NEXT_PUBLIC_HOST}/sala/${id}/` },
  })
  await salaDb.agregarSalaAProfe(email, id)

  if (listaPermitidos.length > 0) {
    await invitadosDb.agregarPermitidosA(listaPermitidos, id)
  }

  return id
}
