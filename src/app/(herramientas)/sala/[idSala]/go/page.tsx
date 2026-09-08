import { Toaster } from 'sonner'
import GoEstudiantePage from '@/components/salas/go/go-estudiante-page'
import { TituloPestanaSala } from '@/components/salas/titulo-pestana-sala'

export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <div className="bg-ld-gradiente-fondo grid place-content-center min-h-screen w-full">
      <Toaster />
      <TituloPestanaSala />
      <GoEstudiantePage idSala={idSala} />
    </div>
  )
}
