import { z } from 'zod'
import { MetodosLogin, PasaporteEstudianteBase, RolSala } from './auth'
import { randomUUID } from 'crypto'
import { nombreDeFantasia } from '../salas/utils'

// ════════════════════════════════════════════════════════════════════════════
// Sesiones de estudiante. Acá es donde aparece el `metodo`: lo inyecta el server (desde
// `config.metodo_login`) al construir la sesión. Cada método valida su propio campo de identidad
// (que el pasaporte de entrada traía como opcional); el `userId` lo resuelve el login después de
// autorizar, con `idOpaco` (`wss/id-opaco.ts`).
// El `userId` de un estudiante es su id opaco por sala: la identidad real (dni/nombre/email) queda
// en su campo de la sesión, para la planilla del profe y la autorización.
// `WssEstudianteSessionSchema` es el documento ya guardado: valida la identidad y conserva el
// `userId` que le asignó la sala.
// El server parte del pasaporte (validators/auth.ts), le suma `metodo` y parsea contra el schema
// del método correspondiente (ver `SESSION_ESTUDIANTE_POR_METODO_LOGIN`).
// ════════════════════════════════════════════════════════════════════════════

// Método 'nombre': el nombre ES la identidad, así que es obligatorio.
const WssEstudianteNombreIdentidadSchema = PasaporteEstudianteBase.extend({
  metodo: z.literal(MetodosLogin.Nombre),
  nombre: z.string().min(1),
})

// Método 'dni': la identidad es el dni; el nombre es solo display (con fallback de fantasía).
const WssEstudianteDniIdentidadSchema = PasaporteEstudianteBase.extend({
  metodo: z.literal(MetodosLogin.DNI),
  dni: z.string().regex(/^\d+$/, 'El DNI debe contener solo dígitos'),
  nombre: z.string().optional(),
}).transform((data) => ({ ...data, nombre: data.nombre || nombreDeFantasia() }))

// Método 'google': el pasaporte trae `token`; el server lo decodea y agrega email/nombre/avatar
// antes de parsear esta sesión. La identidad es el email.
const WssEstudianteGoogleIdentidadSchema = PasaporteEstudianteBase.extend({
  metodo: z.literal(MetodosLogin.Google),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
})

/** Identidad de un estudiante según el método de login de la sala; todavía sin `userId`. */
export const WssEstudianteIdentidadSchema = z.union([
  WssEstudianteNombreIdentidadSchema,
  WssEstudianteDniIdentidadSchema,
  WssEstudianteGoogleIdentidadSchema,
])

/** Documento guardado de un estudiante: su identidad más el id opaco que le asignó la sala. */
export const WssEstudianteSessionSchema = z.union([
  WssEstudianteNombreIdentidadSchema.and(z.object({ userId: z.string().min(1) })),
  WssEstudianteDniIdentidadSchema.and(z.object({ userId: z.string().min(1) })),
  WssEstudianteGoogleIdentidadSchema.and(z.object({ userId: z.string().min(1) })),
])

/** Elige el schema de identidad de estudiante según el metodo_login de la sala. */
export const SESSION_ESTUDIANTE_POR_METODO_LOGIN = {
  [MetodosLogin.Nombre]: WssEstudianteNombreIdentidadSchema,
  [MetodosLogin.DNI]: WssEstudianteDniIdentidadSchema,
  [MetodosLogin.Google]: WssEstudianteGoogleIdentidadSchema,
} as const

/** La identidad real del estudiante según su método de login: lo que la sala autoriza (lista de
 * permitidos) y lo que la planilla del profe muestra. El `userId` es su id opaco por sala, no esto. */
export function identidadRealEstudiante(session: WssEstudianteIdentidad): string {
  switch (session.metodo) {
    case MetodosLogin.DNI:
      return session.dni
    case MetodosLogin.Google:
      return session.email
    case MetodosLogin.Nombre:
      return session.nombre
  }
}

// ------------------------------------------------------------------------------

export const WssProfeSessionSchema = z
  .object({
    rol: z.literal(RolSala.Profe),
    email: z.string().email(),
    nombre: z.string().min(1),
    avatar: z.string().optional(),
  })
  .transform((data) => ({ ...data, userId: data.email }))

export const WssAdminSessionSchema = z
  .object({
    rol: z.literal(RolSala.Admin),
    email: z.string().email(),
    nombre: z.string().min(1),
    avatar: z.string().optional(),
  })
  .transform((data) => ({ ...data, userId: data.email }))

const WssPublicSessionSchema = z
  .object({
    rol: z.literal(RolSala.Publico),
  })
  .transform((data) => ({ ...data, userId: `publico-${randomUUID().split('-')[0]}` }))

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
export type WssEstudianteIdentidad = z.infer<typeof WssEstudianteIdentidadSchema>
export type WssEstudianteSession = z.infer<typeof WssEstudianteSessionSchema>
export type WssProfeSession = z.infer<typeof WssProfeSessionSchema>
export type WssAdminSession = z.infer<typeof WssAdminSessionSchema>
