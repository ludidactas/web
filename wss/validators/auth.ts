import { z } from 'zod'
import { Salas } from '../salas/app'
import { ErrorSesion, TipoErrorSesion } from './errors'

export enum RolSala {
  Admin = 'admin',
  Profe = 'profe',
  Estudiante = 'estudiante',
  Publico = 'publico',
}

// Schemas para validar el pasaporte en el login:

export const PasaporteEstudianteSchema = z
  .object({
    rol: z.literal(RolSala.Estudiante),
    idSala: z.string({ message: 'El id de la sala es obligatorio' }).min(1),
    clientId: z.string().optional(), // ID estable generado en el cliente, persiste en localStorage
    nombre: z.string().optional(),
    icono: z.string().optional(),
    email: z.string().email('El email debe tener un formato válido').optional(), // Pueden tener email si están conectados con Google
    dni: z.string().regex(/^\d+$/, 'El DNI debe contener solo dígitos').optional(),
    avatar: z.string().optional(), // Pueden proveer avatar (el de Google por ej.)
  })
  .strict()

export const PasaporteProfeSchema = z
  .object({
    rol: z.literal(RolSala.Profe),
    token: z.string().min(1),
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

export async function autorizarAccesoASala(auth: PasaporteEstudiante) {
  const sala = await Salas.get(auth.idSala)
  const config = await sala.config()

  // La sala requiere DNI
  if (config.pedir_dni) {
    if (!auth.dni) throw new ErrorSesion(TipoErrorSesion.DniRequerido, `La sala ${auth.idSala} requiere DNI.`)

    // Si la configuración es excluyente, verificamos que el DNI esté en la lista
    if (config.solo_invitados) {
      const permitidos = await sala.listaPermitidos().obtener()
      if (!permitidos.includes(auth.dni))
        throw new ErrorSesion(
          TipoErrorSesion.DniNoPermitido,
          `El DNI ${auth.dni} no está en la lista de participantes permitidos.`
        )
    }
  }
}
