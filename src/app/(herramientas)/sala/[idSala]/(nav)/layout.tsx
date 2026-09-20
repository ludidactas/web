import { Toaster } from 'sonner'
import SalaFloatingNavEstudiante from '@/components/salas/sala-floating-nav-estudiante'
import { TituloPestanaSala } from '@/components/salas/titulo-pestana-sala'

export default async function SalaEstudianteNavLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ idSala: string }>
}) {
  const { idSala } = await params

  return (
    <div className="bg-ld-gradiente-fondo grid place-content-center min-h-screen w-full">
      <Toaster />
      <TituloPestanaSala />
      {children}
      <SalaFloatingNavEstudiante idSala={idSala} />
    </div>
  )
}
