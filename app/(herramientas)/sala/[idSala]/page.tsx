import EncuestasEstudiante from '../components/encuestas-estudiante'
import { EncuestaEstudianteProvider } from '../components/encuestas-estudiante-context'

export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <EncuestaEstudianteProvider idSala={ idSala }>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        { idSala }
        <div className="p-8 w-4/5">
          <EncuestasEstudiante/>
        </div>

        <div className="w-full h-24" />
      </div>
    </EncuestaEstudianteProvider>
  )
}
