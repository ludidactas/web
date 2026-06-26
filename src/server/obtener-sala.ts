'use server'

import { auth } from '@/app/auth'
import * as salaDb from '@/wss/salas/db'

/** Devuelve el ID de la sala del profe autenticado, o null si no tiene. */
export async function obtenerIdSala(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.email) return null
  return salaDb.getIdSalaDeProfe(session.user.email)
}

/** Devuelve el ID y nombre de la sala del profe autenticado, o null si no tiene. */
export async function obtenerSala(): Promise<{ id: string; nombre?: string } | null> {
  const session = await auth()
  if (!session?.user?.email) return null
  const id = await salaDb.getIdSalaDeProfe(session.user.email)
  if (!id) return null
  const sala = await salaDb.getSala(id)
  if (!sala) return null
  return { id, nombre: sala.config.nombre }
}
