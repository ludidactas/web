import { z } from 'zod'
import { MAX_LEN_NOMBRE } from './auth'

/**
 * Lo que el profe anota de una entrada de la lista (identidad) de antemano. Es la única fuente de qué se
 * puede anotar: un campo nuevo se agrega acá y en el FE (formulario, CSV, planilla). Los textos se
 * recortan y una anotación vacía se descarta.
 */
export const infoEntrada = z
  .object({ nombre: z.string().optional() })
  .transform((info): { nombre?: string } => {
    const nombre = info.nombre?.trim().slice(0, MAX_LEN_NOMBRE)
    return nombre ? { nombre } : {}
  })

export type InfoEntrada = z.output<typeof infoEntrada>

/** Si `info` no anota nada. */
export const infoVacia = (info: InfoEntrada) => Object.keys(info).length === 0
