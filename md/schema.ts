import { z } from 'zod'

// Esquema del meta:

// Stats
const statsSchema = z.record(z.string(), z.number())

// Niveles - nivel: lista de ids de unidades pertenecientes
const nivelEnum = z.enum(['contacto', 'allegado', 'familiar', 'avanzado', 'experto'])
const nivelesSchema = z.record(nivelEnum, z.array(z.string()))

// Unidades - Por ahora id: string describiendo las expectativas en términos de "Entiendo"
const unidadesSchema = z.record(z.string(), z.string())

// Requerimientos
const requerimientoMateriaSchema = z.string()

const requerimientoNivelSchema = z.record(z.string(), z.string())

const requerimientoUnidadSchema = z.record(
  // En formato "level.unit"
  z.string().regex(/^[^.]+\.[^.]+$/),
  z.string()
)

const requerimientosSchema = z.array(
  z.union([requerimientoMateriaSchema, requerimientoNivelSchema, requerimientoUnidadSchema])
)

// Meta
export const metaSchema = z
  .object({
    titulo: z.string(),
    descripcion: z.string(),
    stats: statsSchema,
    niveles: nivelesSchema.optional(),
    unidades: unidadesSchema.optional(),
    requiere: requerimientosSchema.optional(), // Refinar para verificar que no requiera unidades o niveles no presentes
  })
  .refine(
    (data) => {
      if (!data.niveles) return true
      if (data.niveles && !data.unidades) return false

      // Extraemos todas las unidades de dentro de niveles
      const nivelUnidades = Object.values(data.niveles)
        .flat()
        .reduce((acc, curr) => acc.add(curr), new Set<string>())

      const faltantes = Array.from(nivelUnidades).filter((unidad) => !(unidad in data.unidades!))

      if (faltantes.length > 0) {
        // @ts-expect-error - Propiedad custom
        data._faltantes = faltantes
      }

      // Checkeamos si todas existen en `unidades`
      return Array.from(nivelUnidades).every((unidad) => unidad in data.unidades!)
    },
    (data) => ({
      // @ts-expect-error - Propiedad custom
      message: `Hay unidades en 'niveles' de ${data.titulo} que no aparecen en 'unidades': ${data._faltantes?.join(
        ', '
      )}`,
      path: ['niveles'], // This will show the error on the niveles field
    })
  )

export type Meta = z.infer<typeof metaSchema>
