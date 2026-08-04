import { Toaster } from 'sonner'
import { SignIn, SignOut } from '../../login/components/botones'
import EncuestasEstudiantePage from '@/components/salas/encuestas-estudiante/encuestras-estudiante-page'
import { TituloPestanaSala } from '@/components/salas/titulo-pestana-sala'

export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <div className="bg-ld-gradiente-fondo grid place-content-center min-h-screen w-full">
      <Toaster />
      <TituloPestanaSala />
      <EncuestasEstudiantePage
        idSala={idSala}
        btnLoginGoogle={<SignIn redirectTo={`/sala/${idSala}`} />}
        btnLogoutGoogle={<SignOut />}
      />
    </div>
  )
}
