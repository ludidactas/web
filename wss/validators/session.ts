import { z } from 'zod'
import { RolEncuesta } from '../tipos'
import { randomUUID } from 'crypto'
import { nombreDeFantasia } from '../salas/utils'

const WssSessionBaseSchema = z.object({
  sessionId: z.string(),
  userIp: z.string().optional(),
  agente: z.string().optional(),
})

const WssEstudianteSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Estudiante),
  idSala: z.string(),
  nombre: z.string().optional(),
  dni: z.string().optional(),
  email: z.string().email().optional(), // Por ahora no está en uso
  icono: z.string().optional(),
}).transform((data) => ({
  ...data,
  nombre: data.nombre || nombreDeFantasia(),
  id: data.dni || data.email || data.nombre || `estudiante-${randomUUID().split('-')[0]}`,
}))

const WssProfeSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Profe),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
}).transform((data) => ({ ...data, id: data.email }))

const WssAdminSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Admin),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
}).transform((data) => ({ ...data, id: data.email }))

const WssPublicSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Publico),
}).transform((data) => ({ ...data, id: `publico-${data.userIp ?? 'NOIP'}-${randomUUID().split('-')[0]}` }))

/** Esquema de sesión válida. Requiere rol. Puede ser o bien de estudiantes, o bien de profe, o bien de admin. Profe y admin requieren email y nombre. */
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
