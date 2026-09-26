import { parse } from 'yaml'
import { ArchivoDesafiosSchema, type Desafio } from '../tipos'

/**
 * Parseo/validación de YAML → `Desafio[]`. Puro (sin `node:fs`): seguro de importar desde cliente o
 * server. Para cargar directo desde disco, ver `cargador-fs.ts` (Node-only) en este mismo directorio.
 */

export class ErrorParseoDesafio extends Error {
  constructor(message: string, public source?: string) {
    super(message)
    this.name = 'ErrorParseoDesafio'
  }
}

/**
 * Parsea y valida un string YAML en uno o más Desafios.
 * `source` solo se usa para que los mensajes de error apunten al archivo
 * correcto — pasá el nombre de archivo cuando lo tengas.
 */
export function parsearDesafios(yamlText: string, source?: string): Desafio[] {
  let raw: unknown
  try {
    raw = parse(yamlText)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new ErrorParseoDesafio(`No pude leer el YAML${source ? ` de ${source}` : ''}: ${detail}`, source)
  }

  const result = ArchivoDesafiosSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new ErrorParseoDesafio(`El desafío${source ? ` en ${source}` : ''} tiene errores:\n${issues}`, source)
  }

  return Array.isArray(result.data) ? result.data : [result.data]
}

/**
 * Valida que un conjunto de desafíos no tenga ids repetidos — un error fácil
 * de cometer cuando varias personas aportan archivos YAML.
 */
export function verificarIdsUnicos(desafios: Desafio[]): void {
  const seen = new Map<string, number>()
  desafios.forEach((d) => seen.set(d.id, (seen.get(d.id) ?? 0) + 1))
  const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id)
  if (dupes.length) {
    throw new ErrorParseoDesafio(`IDs de desafío repetidos: ${dupes.join(', ')}. Cada "id" debe ser único.`)
  }
}
