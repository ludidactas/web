import { z } from 'zod'
import { MetodosLogin, PasaporteEstudianteBase, RolSala } from './auth'
import { idOpaco } from '../id-opaco'
import { randomUUID } from 'crypto'
import { nombreDeFantasia } from '../salas/utils'

// Campos que el server agrega a una sesión (no vienen del pasaporte del cliente).
const camposServer = {
  userIp: z.string().optional(),
  agente: z.string().optional(),
}

// ════════════════════════════════════════════════════════════════════════════
// Sesiones de estudiante. Acá es donde aparece el `metodo`: lo inyecta el server (desde
// `config.metodo_login`) al construir la sesión. Cada método valida su propio campo de identidad
// (que el pasaporte de entrada traía como opcional) y resuelve el `userId` sin adivinar.
// El `userId` de un estudiante es su id opaco por sala (`wss/id-opaco.ts`): la identidad real
// (dni/nombre/email) queda en su campo de la sesión, para la planilla del profe y la autorización.
// El server parte del pasaporte (validators/auth.ts), le suma `metodo` + campos del server,
// y parsea contra el schema del método correspondiente (ver `SESSION_ESTUDIANTE_POR_METODO_LOGIN`).
// ════════════════════════════════════════════════════════════════════════════

// Método 'nombre': el nombre ES la identidad, así que es obligatorio.
export const WssEstudianteNombreSessionSchema = PasaporteEstudianteBase.extend({
  ...camposServer,
  metodo: z.literal(MetodosLogin.Nombre),
  nombre: z.string().min(1),
}).transform((data) => ({ ...data, userId: idOpaco(data.idSala, data.nombre) }))

// Método 'dni': la identidad es el dni; el nombre es solo display (con fallback de fantasía).
export const WssEstudianteDniSessionSchema = PasaporteEstudianteBase.extend({
  ...camposServer,
  metodo: z.literal(MetodosLogin.DNI),
  dni: z.string().regex(/^\d+$/, 'El DNI debe contener solo dígitos'),
  nombre: z.string().optional(),
}).transform((data) => ({
  ...data,
  nombre: data.nombre || nombreDeFantasia(),
  userId: idOpaco(data.idSala, data.dni),
}))

// Método 'google': el pasaporte trae `token`; el server lo decodea y agrega email/nombre/avatar
// antes de parsear esta sesión. La identidad es el email.
export const WssEstudianteGoogleSessionSchema = PasaporteEstudianteBase.extend({
  ...camposServer,
  metodo: z.literal(MetodosLogin.Google),
  email: z.string().email(),
  nombre: z.string().min(1),
  avatar: z.string().optional(),
}).transform((data) => ({ ...data, userId: idOpaco(data.idSala, data.email) }))

export const WssEstudianteSessionSchema = z.union([
  WssEstudianteNombreSessionSchema,
  WssEstudianteDniSessionSchema,
  WssEstudianteGoogleSessionSchema,
])

/** Elige el schema de sesión de estudiante según el metodo_login de la sala. */
export const SESSION_ESTUDIANTE_POR_METODO_LOGIN = {
  [MetodosLogin.Nombre]: WssEstudianteNombreSessionSchema,
  [MetodosLogin.DNI]: WssEstudianteDniSessionSchema,
  [MetodosLogin.Google]: WssEstudianteGoogleSessionSchema,
} as const

/** La identidad real del estudiante según su método de login: lo que la sala autoriza (lista de
 * permitidos) y lo que la planilla del profe muestra. El `userId` es su id opaco por sala, no esto. */
export function identidadRealEstudiante(session: WssEstudianteSession): string {
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
    ...camposServer,
    rol: z.literal(RolSala.Profe),
    email: z.string().email(),
    nombre: z.string().min(1),
    avatar: z.string().optional(),
  })
  .transform((data) => ({ ...data, userId: data.email }))

export const WssAdminSessionSchema = z
  .object({
    ...camposServer,
    rol: z.literal(RolSala.Admin),
    email: z.string().email(),
    nombre: z.string().min(1),
    avatar: z.string().optional(),
  })
  .transform((data) => ({ ...data, userId: data.email }))

const WssPublicSessionSchema = z
  .object({
    ...camposServer,
    rol: z.literal(RolSala.Publico),
  })
  .transform((data) => ({ ...data, userId: `publico-${data.userIp ?? 'NOIP'}-${randomUUID().split('-')[0]}` }))

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
