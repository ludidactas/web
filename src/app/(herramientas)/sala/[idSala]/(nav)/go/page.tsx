import GoEstudiantePage from '@/components/salas/go/go-estudiante'

export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return <GoEstudiantePage idSala={idSala} />
}
