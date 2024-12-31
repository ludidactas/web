import { z } from 'zod'

// Esquema del meta:

// Stats
const statsSchema = z.record(z.string(), z.number())

// Niveles - nivel: lista de ids de unidades pertenecientes

// Nivel de familiaridad:

// 1 - Contacto:
// - Tengo idea de qué va el tema, sus conceptos básicos y rudimentos operativos
// - Puedo más o menos leer estructuralmente contenidos, aunque pudiera no entender todo el vocabulario, y hasta podría realizar pequeñas modificaciones
// - Puede comprobarse con un assessment

// 2 - Allegado:
// - Si bien pueden escaparseme algunos términos, conozco el vocabulario básico que cubre el 80 % de lo que puede expresarse en este dominio, y puedo escribir mis contenidos a partir de consignas claras o contenidos base
// - Puede comprobarse con ejercicios

// 3 - Familiar:
// - En virtud de la práctica y ejercitación reiterada me entiendo con el tema de manera que puedo abrirme paso en escenarios imprevistos
// - Si no conozco algo sé dónde informarme sobre ello y domino la facultad de escribir
// - Puede comprobarse con un proyecto

// 4 - Avanzado:
// - Llevé a término proyectos y conozco las prácticas de la comunidad o la industria
// - Puede comprobarse con un proyecto avanzado, probablemente grupal

// 5 - Expertx:
// - Este dominio no me guarda secretos, y conozco sus puntos de contacto con dominios adyacentes

export const nivelEnum = z.enum(['contacto', 'allegado', 'familiar', 'avanzado', 'experto'])
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
    stats: statsSchema.optional(),
    niveles: nivelesSchema.optional(),
    unidades: unidadesSchema.optional(),
    requiere: requerimientosSchema.optional(), // Refinar para verificar que no requiera unidades o niveles no presentes
  })
  // Checkea la relación entre niveles y unidades
  .refine(
    (data) => {
      if (!data.niveles) return true
      if (data.niveles && !data.unidades) return false

      // Extraemos todas las unidades de dentro de niveles
      const nivelUnidades = Object.values(data.niveles)
        .flat()
        .reduce((acc, curr) => acc.add(curr), new Set<string>())

      const faltantes = Array.from(nivelUnidades).filter((unidad) => !(unidad in data.unidades!))

      // @ts-expect-error - Propiedad custom
      if (faltantes.length > 0) data._faltantes = faltantes

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
  // Checkea que ninguna unidad colisione con un nombre de nivel
  .refine(
    (data) => {
      if (!data.unidades) return true
      const colisiones = Object.keys(data.unidades).filter((u) => nivelEnum.safeParse(u).success)
      // @ts-expect-error - Propiedad custom
      if (colisiones.length > 0) data._colisiones = colisiones
      return colisiones.length == 0
    },
    (data) => ({
      // @ts-expect-error - Propiedad custom
      message: `Hay unidades en ${data.titulo} nombradas como niveles: ${data._colisiones?.join(', ')}`,
      path: ['unidades'],
    })
  )

export type Meta = z.infer<typeof metaSchema>
export type Nivel = z.infer<typeof nivelEnum>
