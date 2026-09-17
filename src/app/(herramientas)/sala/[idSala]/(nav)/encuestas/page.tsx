import { SignIn, SignOut } from '@/app/(herramientas)/login/components/botones'
import EncuestasEstudiantePage from '@/components/salas/encuestas-estudiante/encuestras-estudiante-page'

export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <EncuestasEstudiantePage
      idSala={idSala}
      btnLoginGoogle={<SignIn redirectTo={`/sala/${idSala}/encuestas`} />}
      btnLogoutGoogle={<SignOut />}
    />
  )
}
