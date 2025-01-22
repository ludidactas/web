import { articuloMetaSchema, Meta, MetaUnidad } from '@/md/schema'
import { glob } from 'glob'
import { ReactNode } from 'react'
import { join } from 'path'
import { groupBy } from 'remeda'

interface Md {
  default: ReactNode
  meta: Meta
  src: string
  ok?: boolean
}

export default async function Page() {
  // Obtenemos la ruta de la carpeta de mds...
  const mdDir = join(process.cwd(), 'md')

  // Levantantamos todas las rutas de archivos mds dentro de ella...
  const pathsMds = await glob('**/*.mdx', { cwd: mdDir })

  // Los importamos todos...
  const mds: Md[] = []
  for (const fn of pathsMds) {
    const { default: Post, meta } = await import(`@/md/${fn}`)
    mds.push({ default: Post, meta, src: fn })
  }

  // Los verificamos
  for (const md of mds) {
    md.ok = articuloMetaSchema.safeParse(md.meta).success
  }

  // Filtramos
  const mdsOk = mds.filter((md) => md.ok)
  const mdsBad = mds.filter((md) => !md.ok)

  const materias = mdsOk.filter((md) => md.meta.tipo == 'materia')
  const unidadesValidas = mdsOk.filter((md) => md.meta.tipo == 'unidad')
  const unidades = groupBy(unidadesValidas, (md) => (md.meta as MetaUnidad).materia)

  return (
    <div>
      <h3 className="text-2xl">Mds materias:</h3>
      <pre>{JSON.stringify(materias, null, 2)}</pre>
      <h3 className="text-2xl">Mds unidades:</h3>
      <pre>{JSON.stringify(unidades, null, 2)}</pre>
      <h3 className="text-2xl">Mds malos:</h3>
      <pre>{JSON.stringify(mdsBad, null, 2)}</pre>
    </div>
  )
}
