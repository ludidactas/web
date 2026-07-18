import { Toaster } from 'sonner'
import { SignIn, SignOut } from '../../login/components/botones'
import EncuestasEstudiantePage from '@/components/salas/encuestas-estudiante/encuestras-estudiante-page'
import { TituloPestanaSala } from '@/components/salas/titulo-pestana-sala'

export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <div className="bg-gradient-to-r grid place-content-center from-cyan-500/70 to-indigo-500/70 min-h-screen w-full">
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
