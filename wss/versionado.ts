import type { ZodType, ZodTypeDef } from 'zod'

/** Lleva un documento de la versión `i` a la `i + 1`. Pura: recibe y devuelve JSON ya parseado. */
export type Migracion = (doc: Record<string, unknown>) => Record<string, unknown>

export interface Versionado<T> {
  /** Versión con la que se escribe: la cantidad de migraciones declaradas. */
  version: number
  /** String guardado en redis → valor del schema actual. Lanza si no se puede interpretar. */
  parsear(str: string): T
  /** Valor del schema actual → string para redis, marcado con la versión actual (`v`). */
  serializar(valor: T): string
}

/**
 * Codec de un documento JSON guardado en redis. Un documento sin `v` es versión 0.
 * Al leer se le aplican, en orden, las migraciones que le faltan y se valida con `schema`, así que
 * el resto del código solo ve la forma actual. Leer no escribe en redis: el documento queda migrado
 * en la próxima escritura normal.
 *
 * Cambios aditivos (campo nuevo con `.default()`/`.optional()`) no necesitan migración;
 * ver `docs/versionado-redis.md`.
 */
export function versionado<T>(opciones: {
  schema: ZodType<T, ZodTypeDef, unknown>
  migraciones?: Migracion[]
}): Versionado<T> {
  const { schema, migraciones = [] } = opciones
  const version = migraciones.length

  return {
    version,

    parsear(str) {
      const crudo: unknown = JSON.parse(str)
      if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) {
        throw new Error('Documento de redis inválido: se esperaba un objeto JSON')
      }
      const { v = 0, ...resto } = crudo as Record<string, unknown>
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
        throw new Error(`Documento de redis con versión inválida: ${JSON.stringify(v)}`)
      }
      if (v > version) {
        throw new Error(`Documento de redis en versión ${v}, más nueva que la ${version} que conoce este server`)
      }
      let doc = resto
      for (let i = v; i < version; i++) doc = migraciones[i](doc)
      return schema.parse(doc)
    },

    serializar(valor) {
      return JSON.stringify({ ...(valor as object), v: version })
    },
  }
}
