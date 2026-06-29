import { z } from 'zod'

export enum RolSala {
  Admin = 'admin',
  Profe = 'profe',
  Estudiante = 'estudiante',
  Publico = 'publico',
}

export enum MetodosLogin {
  Nombre = 'nombre',
  DNI = 'dni',
  Google = 'google',
}

// ════════════════════════════════════════════════════════════════════════════
//  PASAPORTE — el auth que el FE presenta al conectar (la ENTRADA del proceso de login).
//
//  Sutileza clave del modelo: para estudiante, el `metodo` de auth (nombre/dni/google) NO lo decide
//  ni lo manda el cliente — lo impone la SALA vía `config.metodo_login`. Por eso el pasaporte de estudiante
//  es method-agnostic: una bolsa floja de campos de identidad opcionales, SIN `metodo`. El FE solo
//  manda lo que la sala le pidió recolectar.
//
//  El `metodo` es un concepto de la SALIDA, no de la entrada: se inyecta recién al construir la
//  `Session` (ver validators/session.ts), que es donde el server ya conoce el metodo_login, valida el
//  campo de identidad correspondiente y resuelve el `userId`.
//
//  Profe/admin/publico no tienen esta sutileza (no llevan `metodo`).
//
//  La idea, en resumen, es: Pasaporte -> login -> Session
// ════════════════════════════════════════════════════════════════════════════

export const PasaporteEstudianteBase = z.object({
  rol: z.literal(RolSala.Estudiante),
  idSala: z.string({ message: 'El id de la sala es obligatorio' }).min(1),
  clientId: z.string().optional(), // ID estable generado en el cliente, persiste en localStorage
})

/**
 * Entrada de estudiante: bolsa floja de campos de identidad; la sala elige cuál usar (vía su metodo_login)
 * y el server descarta el resto al construir la sesión.
 */
export const PasaporteEstudianteSchema = PasaporteEstudianteBase.extend({
  nombre: z.string().optional(),
  dni: z.string().optional(),
  email: z.string().optional(),
  avatar: z.string().optional(),
  token: z.string().optional(),
})

export const PasaporteProfeSchema = z
  .object({
    rol: z.literal(RolSala.Profe),
    token: z.string().min(1),
    // La sala que el profe va a operar. El server valida que exista y que sea suya antes de abrir sesión.
    idSala: z.string({ message: 'El id de la sala es obligatorio' }).min(1),
  })
  .strict()

export const PasaporteAdminSchema = z
  .object({
    rol: z.literal(RolSala.Admin),
    token: z.string().min(1),
  })
  .strict()

export const PasaportePublicoSchema = z
  .object({
    rol: z.literal(RolSala.Publico),
    idSala: z.string().min(1),
  })
  .strict()

export const PasaporteSchema = z.union([
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
