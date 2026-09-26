import GoEstudiantePage from '@/components/salas/go/go-estudiante'

/** Tab "Go" de la sala para el estudiante — la vista del profe es `salas/[idSala]/go/page.tsx`. */
export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return <GoEstudiantePage idSala={idSala} />
}
