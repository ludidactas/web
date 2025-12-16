
import { Toaster } from 'sonner'
import { SignIn, SignOut } from '../../login/components/botones'
import { EncuestaEstudianteLoginProvider } from '@/components/salas/encuestas-estudiante/encuestas-estudiante-login-context'
import EncuestasEstudiantePage from '@/components/salas/encuestas-estudiante/encuestras-estudiante-page'


export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <div className="bg-gradient-to-r grid place-content-center from-cyan-200/70 to-indigo-200/70 min-h-screen w-full">
      <Toaster />
      <EncuestaEstudianteLoginProvider>
        <EncuestasEstudiantePage
          idSala={idSala}
          btnLoginGoogle={<SignIn redirectTo={`/sala/${idSala}`} />}
          btnLogoutGoogle={<SignOut />}
        />
      </EncuestaEstudianteLoginProvider>
    </div>
  )
}
