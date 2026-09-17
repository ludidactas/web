import { auth } from '@/app/auth'
import EncuestasProfe from '@/components/salas/encuestas-profe'
import { tieneIntegracionGoogle } from '@/server/entitlements'

export default async function EncuestasSalaPage() {
  const session = await auth()
  const integracionGoogle = await tieneIntegracionGoogle(session?.user?.email)

  return <EncuestasProfe integracionGoogle={integracionGoogle} driveConectado={session?.driveConectado ?? false} />
}
