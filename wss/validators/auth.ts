import { z } from "zod"
import { RolEncuesta } from "../tipos"

export const PasaporteEstudianteSchema = z.object({
  rol: z.literal(RolEncuesta.Estudiante),
  idSala: z.string({message: "El id de la sala es obligatorio"}).min(1),
  nombre: z.string().optional(),
  icono: z.string().optional(),
  email: z.string().email('El email debe tener un formato válido').optional(),
  dni: z.string().regex(/^\d+$/, 'El DNI debe contener solo dígitos').optional()
})

export const PasaporteProfeSchema = z.object({
  rol: z.literal(RolEncuesta.Profe),
  token: z.string().min(1)
})

export const PasaporteAdminSchema = z.object({
  rol: z.literal(RolEncuesta.Admin),
  token: z.string().min(1)
})

export const PasaporteTesterSchema = z.object({
  rol: z.literal(RolEncuesta.Tester),
  url: z.string(),
  nombre: z.string().optional()
})

export const PasaportePublicoSchema = z.object({
  rol: z.literal(RolEncuesta.Publico),
  idSala: z.string().min(1)
})

export const PasaporteSchema = z.discriminatedUnion('rol', [
  PasaporteEstudianteSchema,
  PasaporteProfeSchema,
  PasaporteAdminSchema,
  PasaporteTesterSchema,
  PasaportePublicoSchema,
])

export type Pasaporte = z.infer<typeof PasaporteSchema>
export type PasaporteEstudiante = z.infer<typeof PasaporteEstudianteSchema>
export type PasaporteProfe = z.infer<typeof PasaporteProfeSchema>
export type PasaporteTester = z.infer<typeof PasaporteTesterSchema>
export type PasaportePublico = z.infer<typeof PasaportePublicoSchema>
export type PasaporteAdmin = z.infer<typeof PasaporteAdminSchema>

// Schemas para validar la sesión en el handshake:

export const SesionEstudianteSchema = z.object({
  rol: z.literal(RolEncuesta.Estudiante),
  sessionId: z.string().min(1),
})

export const SesionProfeSchema = z.object({
  rol: z.literal(RolEncuesta.Profe),
  sessionId: z.string().min(1),
  token: z.string(),
})

export const SesionAdminSchema = z.object({
  rol: z.literal(RolEncuesta.Admin),
  sessionId: z.string().min(1),
  token: z.string(),
})
  
export const SesionSchema = z.discriminatedUnion('rol', [
  SesionEstudianteSchema,
  SesionProfeSchema,
  SesionAdminSchema,
])
