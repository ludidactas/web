import { z } from 'zod'
import { RolEncuesta } from '../tipos'

// Schemas para validar el pasaporte en el login:

export const PasaporteEstudianteSchema = z
  .object({
    rol: z.literal(RolEncuesta.Estudiante),
    idSala: z.string({ message: 'El id de la sala es obligatorio' }).min(1),
    nombre: z.string().optional(),
    icono: z.string().optional(),
    email: z.string().email('El email debe tener un formato válido').optional(), // Pueden tener email si están conectados con Google
    dni: z.string().regex(/^\d+$/, 'El DNI debe contener solo dígitos').optional(),
    avatar: z.string().optional(), // Pueden proveer avatar (el de Google por ej.)
  })
  .strict()

export const PasaporteProfeSchema = z
  .object({
    rol: z.literal(RolEncuesta.Profe),
    token: z.string().min(1),
  })
  .strict()

export const PasaporteAdminSchema = z
  .object({
    rol: z.literal(RolEncuesta.Admin),
    token: z.string().min(1),
  })
  .strict()

export const PasaportePublicoSchema = z
  .object({
    rol: z.literal(RolEncuesta.Publico),
    idSala: z.string().min(1),
  })
  .strict()

export const PasaporteSchema = z.discriminatedUnion('rol', [
  PasaporteEstudianteSchema,
  PasaporteProfeSchema,
  PasaporteAdminSchema,
  PasaportePublicoSchema,
])

export type Pasaporte = z.infer<typeof PasaporteSchema>
export type PasaporteEstudiante = z.infer<typeof PasaporteEstudianteSchema>
export type PasaporteProfe = z.infer<typeof PasaporteProfeSchema>
export type PasaportePublico = z.infer<typeof PasaportePublicoSchema>
export type PasaporteAdmin = z.infer<typeof PasaporteAdminSchema>
