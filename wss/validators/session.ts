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
  icono: z.string().optional(),
  // Estudiantes con sesión de Google:
  email: z.string().email().optional(),
  avatar: z.string().optional(),
}).transform((data) => ({
  ...data,
  nombre: data.nombre || nombreDeFantasia(),
  es_anonimo: !data.dni && !data.email,
  userId: data.dni || data.email || data.nombre || `estudiante-${randomUUID().split('-')[0]}`,
}))

const WssProfeSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Profe),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
}).transform((data) => ({ ...data, userId: data.email }))

const WssAdminSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Admin),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
}).transform((data) => ({ ...data, userId: data.email }))

const WssPublicSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Publico),
}).transform((data) => ({ ...data, userId: `publico-${data.userIp ?? 'NOIP'}-${randomUUID().split('-')[0]}` }))

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
