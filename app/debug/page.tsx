import { importarBiblioteca } from '@/lib/importMdx'

export default async function Page() {
  const { materias, unidades, mdsBad } = await importarBiblioteca()

  return (
    <div className="p-4">
      <h3 className="text-2xl">Materias:</h3>
      {materias.map((m) => (
        <pre key={m.meta.id}>
          {' '}
          - {m.meta.titulo} @ {m.src}{' '}
        </pre>
      ))}

      <h3 className="text-2xl">Mds unidades:</h3>
      {unidades.map((u) => (
        <pre key={u.meta.id}>
          {u.meta.titulo} @ {u.src}
        </pre>
      ))}

      <h3 className="text-2xl">Mds malos:</h3>
      {mdsBad.map((md) => (
        <div key={md.src} className="mt-4">
          <h4 className="font-bold">{md.meta.titulo || 'Sin título'}</h4>
          <ul className="list-disc pl-6">
            {md.issues?.flatMap((issue) =>
              issue.code === 'invalid_union' ? (
                issue.unionErrors.flatMap((unionError) =>
                  unionError.issues.map((nestedIssue, i) => (
                    <li key={`${md.src}-${i}`} className="text-red-600">
                      {nestedIssue.path.join('.')} - {nestedIssue.message}
                    </li>
                  ))
                )
              ) : (
                <li key={`${md.src}-main`} className="text-red-600">
                  {issue.path.join('.')} - {issue.message}
                </li>
              )
            )}
          </ul>
        </div>
      ))}
    </div>
  )
}
