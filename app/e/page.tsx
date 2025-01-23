import { importarBiblioteca } from '@/lib/importMdx'

export default async function Page() {
  const { materias, unidades, mdsBad } = await importarBiblioteca()

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
