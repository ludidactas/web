import { SignIn, SignOut } from '../../login/components/botones'
import EncuestasEstudiantePage from '../components/encuestras-estudiante-page'

export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <div className="bg-gradient-to-r place-content-center from-cyan-200/70 to-indigo-200/70 min-h-screen w-full">
      <EncuestasEstudiantePage idSala={idSala} btnLogin={<SignIn redirectTo={`/sala/${idSala}`}/>} btnLogout={<SignOut/>}/>
    </div>
  )
}
