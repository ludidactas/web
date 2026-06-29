'use server'

import { auth } from '@/app/auth'
import * as salaDb from '@/wss/salas/db'
import { getPlanDeProfe } from '@/wss/suscripciones/planes'
import type { ConfigSala } from '@/wss/validators/salas'

export type SalaResumen = { id: string; nombre?: string; config: ConfigSala }

/** Email del profe autenticado, o lanza si no hay sesión. */
async function emailProfe(): Promise<string> {
  const session = await auth()
  if (!session?.user?.email) throw new Error('No autenticado')
  return session.user.email
}

/** Verifica que la sala exista y sea del profe autenticado; devuelve su email. */
async function assertDueño(salaId: string): Promise<string> {
  const email = await emailProfe()
  const dueño = await salaDb.getEmailProfe(salaId)
  if (dueño !== email) throw new Error('La sala no existe o no te pertenece')
  return email
}

/** Máximo de salas que el profe autenticado puede tener según su plan. */
export async function obtenerLimiteSalas(): Promise<number> {
  const email = await emailProfe()
  return getPlanDeProfe(email).maxSalas
}

/** Devuelve todas las salas del profe autenticado (puede ser una lista vacía). */
export async function listarSalas(): Promise<SalaResumen[]> {
  const email = await emailProfe()
  const ids = await salaDb.getIdsSalasDeProfe(email)
  const salas = await Promise.all(ids.map((id) => salaDb.getSala(id)))
  return salas
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map((s) => ({ id: s.id, nombre: s.config.nombre, config: s.config }))
}

/** Renombra una sala del profe autenticado. */
export async function renombrarSala(salaId: string, nombre: string): Promise<void> {
  await assertDueño(salaId)
  const sala = await salaDb.getSala(salaId)
  if (!sala) throw new Error('La sala no existe')
  sala.config.nombre = nombre.trim()
  await salaDb.guardarSala(sala)
}

/** Elimina una sala del profe autenticado y todas sus claves derivadas. */
export async function eliminarSala(salaId: string): Promise<void> {
  const email = await assertDueño(salaId)
  await salaDb.borrarSala(salaId)
  await salaDb.eliminarSalaDeProfe(email, salaId)
}
