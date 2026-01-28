import { z } from 'zod'
import { RolEncuesta } from '../tipos'

const WssSessionBaseSchema = z.object({
  sessionId: z.string(),
  userIp: z.string().optional(),
  agente: z.string().optional(),
})

const WssEstudianteSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Estudiante),
  nombre: z.string().optional(),
  dni: z.string().optional(),
  email: z.string().email().optional(), // Por ahora no está en uso
  icono: z.string().optional(),

  // Derivado. Puede ser dni, email, ip o incluso sessionId. La idea es que sea un identificador único del estudiante en la sala.
  id: z.string().optional(),
})

const WssProfeSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Profe),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
})

const WssAdminSessionSchema = WssSessionBaseSchema.extend({
  rol: z.literal(RolEncuesta.Admin),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
})

/** Esquema de sesión válida. Requiere rol. Puede ser o bien de estudiantes, o bien de profe, o bien de admin. Profe y admin requieren email y nombre. */
export const WssServerSessionSchema = z.discriminatedUnion('rol', [
  WssEstudianteSessionSchema,
  WssProfeSessionSchema,
  WssAdminSessionSchema,
])

// Inferir los tipos desde Zod
export type WssServerSession = z.infer<typeof WssServerSessionSchema>
export type WssEstudianteSession = z.infer<typeof WssEstudianteSessionSchema>
export type WssProfeSession = z.infer<typeof WssProfeSessionSchema>
export type WssAdminSession = z.infer<typeof WssAdminSessionSchema>
