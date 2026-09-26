import { z } from 'zod'
import { NEGRO, BLANCO, type Color } from '@/lib/go/motor'

export type { Color }

/**
 * Tipos y schema (zod) de un `Desafio` — el contrato que debe cumplir el YAML que escriben los
 * content creators (ver el header de cada `.yaml` en `desafios/`). Lo que valida contra `DesafioSchema`
 * termina renderizado por `DesafioDojoGo` y evaluado por `motor-desafio.ts`.
 */

/**
 * Un punto del tablero, 0-indexado desde arriba a la izquierda — coincide con la
 * convención de dibujo de DesafioDojoGo (fila = r, columna = c).
 */
export const ColorPiedraSchema = z.enum([NEGRO, BLANCO])

export const PiedraSchema = z.object({
  r: z.number().int().min(0),
  c: z.number().int().min(0),
  color: ColorPiedraSchema,
})
export type Piedra = z.infer<typeof PiedraSchema>

/** Par de coordenadas [fila, columna]. En YAML se escribe como una lista de 2 elementos: [4, 5] */
export const PuntoSchema = z.tuple([z.number().int().min(0), z.number().int().min(0)]).describe('[fila, columna]')
export type Punto = z.infer<typeof PuntoSchema>

/** Anotación puramente decorativa — no afecta el juego ni los clicks. */
export const TipoMarcaSchema = z.enum(['letra', 'circulo', 'triangulo', 'cuadrado', 'cruz'])
export type TipoMarca = z.infer<typeof TipoMarcaSchema>

export const MarcaSchema = z.object({
  /** Fila */
  r: z.number().int().min(0),
  /** Columna */
  c: z.number().int().min(0),
  tipo: TipoMarcaSchema,
  /** Solo tiene sentido para tipo: "letra" — el o los caracteres que se dibujan en ese punto. */
  texto: z.string().optional(),
})
export type Marca = z.infer<typeof MarcaSchema>

/**
 * Feedback por punto para un desafío: cada entrada es un punto que el estudiante
 * podría clickear, con su propio veredicto correcto/incorrecto, su propio texto
 * de explicación, y marcas que se revelan recién cuando el estudiante llega ahí.
 * La usa `tipo: "jugada"` (como alternativa a `jugadasCorrectas` + una sola
 * `explicacion`) y la requiere `tipo: "exploracion"`.
 */
export const DesenlaceSchema = z.object({
  en: PuntoSchema,
  correcto: z.boolean(),
  texto: z.string().min(1),
  marcas: z.array(MarcaSchema).default([]),
})
export type Desenlace = z.infer<typeof DesenlaceSchema>

/**
 * Una rama del árbol de jugadas de un desafío `tipo: "secuencia"`: un punto que
 * el estudiante podría jugar en alguna etapa del problema.
 */
export interface RamaSecuencia {
  en: Punto
  correcto: boolean
  texto: string
  marcas: Marca[]
  /** La respuesta pre-escrita del rival, aplicada automáticamente si `siguiente` continúa la línea. */
  respuestaRival?: Punto
  /** Ausente = esta rama es terminal (el problema termina acá, con `correcto` + `texto` como veredicto). */
  siguiente?: NodoSecuencia
}

/** Un punto del árbol donde el estudiante tiene que elegir entre `ramas`. */
export interface NodoSecuencia {
  ramas: RamaSecuencia[]
}

// z.lazy() porque ambos schemas se referencian entre sí — las anotaciones explícitas
// z.ZodType<Output, ZodTypeDef, unknown> evitan el ciclo en la inferencia de tipos
// (el parámetro `unknown` de entrada evita que el `.default([])` de `marcas` vuelva
// el tipo de *entrada* más laxo que `RamaSecuencia`/`NodoSecuencia`, que describen
// la *salida* ya parseada).
export const RamaSecuenciaSchema: z.ZodType<RamaSecuencia, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.object({
    en: PuntoSchema,
    correcto: z.boolean(),
    texto: z.string().min(1),
    marcas: z.array(MarcaSchema).default([]),
    respuestaRival: PuntoSchema.optional(),
    siguiente: NodoSecuenciaSchema.optional(),
  })
)

export const NodoSecuenciaSchema: z.ZodType<NodoSecuencia, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.object({
    ramas: z.array(RamaSecuenciaSchema).min(1),
  })
)

/**
 * Un problema. Es la unidad que un content creator escribe en YAML.
 * Solo `id`, `jugadasCorrectas`, `explicacion` y `piedras` son obligatorios —
 * todo lo demás tiene un default razonable para que los problemas simples
 * sigan siendo simples.
 *
 * `jugadasCorrectas`/`explicacion` y `desenlaces`/`secuencia` se validan juntos
 * más abajo (ver `superRefine`), no vía TypeScript, para que todo desafío
 * de una sola jugada existente siga parseando sin cambios.
 */
export const DesafioSchema = z
  .object({
    id: z.string().min(1),
    titulo: z.string().min(1),
    /** Categoría en texto libre usada para filtrar, ej. "atari", "vida-muerte", "ko" */
    etiqueta: z.string().default('general'),
    /** 1 (más fácil) a 5 (más difícil). Puramente informativo, para ordenar/badges. */
    dificultad: z.number().int().min(1).max(5).optional(),
    /** El tablero siempre es cuadrado, N x N. 9 para uno de principiante, 19 para uno completo. */
    tamañoTablero: z.number().int().min(3).max(19).default(9),
    /** Con qué color juega el estudiante. Casi siempre negras. */
    turno: ColorPiedraSchema.default('N'),
    /** Piedras ya puestas en el tablero antes de que juegue el estudiante. */
    piedras: z.array(PiedraSchema).default([]),
    /** Frase mostrada arriba del tablero indicando qué tiene que hacer el estudiante. */
    instruccion: z.string().optional(),
    /**
     * Cómo responde el tablero a los clicks del estudiante:
     * - "jugada" (default): un click, correcto o no, traba el tablero.
     * - "exploracion": varios puntos clickeables, cada uno con su propio texto, nunca traba — para diagramas de referencia/anotación.
     * - "secuencia": un árbol de varias jugadas con respuesta automática del rival — ver `secuencia`.
     */
    tipo: z.enum(['jugada', 'exploracion', 'secuencia']).default('jugada'),
    /** Anotaciones del tablero siempre visibles (letras de referencia, círculos, etc.) — puramente decorativas. */
    marcas: z.array(MarcaSchema).default([]),
    /**
     * Cada punto que cuenta como respuesta correcta. La mayoría de los problemas
     * tienen uno solo, pero problemas simétricos (ej. "capturá de cualquier lado")
     * pueden listar varios. Se ignora si `desenlaces` está definido.
     */
    jugadasCorrectas: z.array(PuntoSchema).optional(),
    /**
     * Punto que revela el botón "Ayuda". Si no se define, usa la primera entrada
     * de jugadasCorrectas (o el primer desenlace correcto).
     */
    ayuda: PuntoSchema.optional(),
    /** Se muestra en el panel de explicación al resolver, o a pedido, para cualquier tipo. */
    explicacion: z.string().optional(),
    /**
     * Feedback por punto, en vez de `jugadasCorrectas` + una sola `explicacion`
     * compartida: cada punto clickeable tiene su propio veredicto y texto.
     * Requerido para `tipo: "exploracion"`; opcional (pero soportado) para `tipo: "jugada"`.
     */
    desenlaces: z.array(DesenlaceSchema).optional(),
    /** Árbol de varias jugadas con respuesta automática del rival. Requerido para `tipo: "secuencia"`. */
    secuencia: NodoSecuenciaSchema.optional(),
    /** Overrides opcionales del texto del banner de feedback. */
    mensajeExito: z.string().optional(),
    mensajeError: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'secuencia') {
      if (!data.secuencia) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['secuencia'],
          message: 'tipo: "secuencia" requiere el campo `secuencia` (el árbol de jugadas).',
        })
      }
      return
    }

    const hasDesenlaces = !!data.desenlaces && data.desenlaces.length > 0
    const hasLegacy = !!data.jugadasCorrectas && data.jugadasCorrectas.length > 0 && !!data.explicacion

    if (data.tipo === 'exploracion' && !hasDesenlaces) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['desenlaces'],
        message: 'tipo: "exploracion" requiere `desenlaces` (un texto propio por cada punto clickeable).',
      })
      return
    }

    if (!hasDesenlaces && !hasLegacy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: 'Definí `jugadasCorrectas` + `explicacion`, o `desenlaces`.',
      })
    }
  })
export type Desafio = z.infer<typeof DesafioSchema>

/** Un archivo YAML puede tener un desafío suelto o una lista de ellos. */
export const ArchivoDesafiosSchema = z.union([DesafioSchema, z.array(DesafioSchema)])
export type ArchivoDesafios = z.infer<typeof ArchivoDesafiosSchema>

/** El resultado de que el estudiante ponga una piedra, antes de que intervenga la UI. */
export interface ResultadoEvaluacion {
  /** El punto que clickeó el estudiante. */
  jugada: Punto
  /** Puntos removidos del tablero como resultado de esta jugada. */
  capturadas: Set<string>
  /** Si este punto matchea una de las respuestas aceptadas del desafío. */
  esCorrecta: boolean
  /** Feedback por punto, seteado solo cuando el desafío define `desenlaces` y este punto matchea uno. */
  desenlace?: { texto: string; marcas: Marca[] }
}
