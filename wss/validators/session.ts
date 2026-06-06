import { z } from 'zod'
import { RolSala } from './auth'
import { randomUUID } from 'crypto'
import { nombreDeFantasia } from '../salas/utils'

const WssSessionBaseSchema = z.object({
  sessionId: z.string(), // Legacy
  userIp: z.string().optional(),
  agente: z.string().optional(),
})

export const WssEstudianteSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolSala.Estudiante),
  idSala: z.string(),
  userId: z.string().optional(), // UUID pre-resuelto por el sistema de identidades
  clientId: z.string().optional(),
  nombre: z.string().optional(),
  dni: z.string().optional(),
  icono: z.string().optional(),
  // Estudiantes con sesión de Google:
  email: z.string().email().optional(),
  avatar: z.string().optional(),
}).transform((data) => {
  const nombre = data.nombre || nombreDeFantasia()
  return {
    ...data,
    nombre,
    userId: data.userId ?? (data.clientId ? `${data.clientId}:${nombre}` : `estudiante-${randomUUID().split('-')[0]}`),
  }
})

const WssProfeSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolSala.Profe),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
}).transform((data) => ({ ...data, userId: data.email }))

const WssAdminSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolSala.Admin),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
}).transform((data) => ({ ...data, userId: data.email }))

const WssPublicSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolSala.Publico),
}).transform((data) => ({ ...data, userId: `publico-${data.userIp ?? 'NOIP'}-${randomUUID().split('-')[0]}` }))

/**
 * Esquema de sesión válida. Requiere rol.
 * Puede ser o bien de estudiantes, o bien de profe, o bien de admin.
 * Profe y admin requieren email y nombre.
 *
 * Existe solo attacheada al socket por el middleware de sesión,
 * no storeamos sesiones en redis.
 */
export const WssServerSessionSchema = z.union([
  WssEstudianteSessionSchema,
  WssProfeSessionSchema,
  WssAdminSessionSchema,
  WssPublicSessionSchema,
])

// Inferir los tipos desde Zod
export type WssServerSession = z.infer<typeof WssServerSessionSchema>
export type WssEstudianteSession = z.infer<typeof WssEstudianteSessionSchema>
export type WssProfeSession = z.infer<typeof WssProfeSessionSchema>
export type WssAdminSession = z.infer<typeof WssAdminSessionSchema>
