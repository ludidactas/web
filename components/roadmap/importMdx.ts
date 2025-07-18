import { articuloMetaSchema, Meta, MetaMateria, MetaUnidad } from '@/components/roadmap/md/schema'
import { glob } from 'fast-glob'
import { join } from 'path'
import { ZodError } from 'zod'

export type MDXModule = {
  default: React.ComponentType
  meta: MetaUnidad | MetaMateria
}

interface Md {
  meta: Meta
  src: string
}

interface MdMateria extends Md {
  meta: MetaMateria
}

const esMateria = (md: Md): md is MdMateria => {
  return md.meta.tipo == 'materia'
}

interface MdUnidad extends Md {
  meta: MetaUnidad
}

const esUnidad = (md: Md): md is MdUnidad => {
  return md.meta.tipo == 'unidad'
}

export async function importarBiblioteca() {
  // console.log(`Levantando MDs!`)

  // Obtenemos la ruta de la carpeta de mds...
  const mdDir = join(process.cwd(), 'md')

  // Levantantamos todas las rutas de archivos mds dentro de ella...
  const pathsMds = await glob('**/*.mdx', { cwd: mdDir })

  // Los importamos todos...
  const mds: (Md & { ok?: boolean; issues?: ZodError['issues'] })[] = []
  for (const fn of pathsMds) {
    const { meta } = await import(`@/md/${fn}`)
    mds.push({ meta, src: fn })
  }

  // Los verificamos
  for (const md of mds) {
    const parseInfo = articuloMetaSchema.safeParse(md.meta)
    md.ok = parseInfo.success
    md.issues = parseInfo.error?.issues
  }

  // Filtramos
  const mdsOk = mds.filter((md) => md.ok)
  const mdsBad = mds.filter((md) => !md.ok)

  const materias = mdsOk.filter(esMateria)
  const unidades = mdsOk.filter(esUnidad)

  return { mdsOk, mdsBad, materias, unidades }
}
