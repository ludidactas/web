import { EncuestaEstudianteProvider } from '../../components/encuestas-estudiante-context'
import TestEstadisticaApp from './components/estadistica-svg-claude'

export default async function OverlayEncuestas({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <EncuestaEstudianteProvider idSala={idSala}>
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center">
        {idSala}
        <TestEstadisticaApp />
      </div>
    </EncuestaEstudianteProvider>
  )
}
