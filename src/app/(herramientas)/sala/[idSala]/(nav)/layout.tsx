import { Toaster } from 'sonner'
import SalaFloatingNavEstudiante from '@/components/salas/sala-floating-nav-estudiante'
import { SalaEstudianteConexion } from '@/components/salas/sala-estudiante-conexion'
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
      <SalaEstudianteConexion idSala={idSala}>{children}</SalaEstudianteConexion>
      <SalaFloatingNavEstudiante idSala={idSala} />
    </div>
  )
}
