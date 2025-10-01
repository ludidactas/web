import { EncuestaEstudianteProvider } from '../../components/encuestas-estudiante-context'
import TestEstadisticaApp from './components/estadistica-svg-claude'

export default async function OverlayEncuestas({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <EncuestaEstudianteProvider idSala={idSala} nombre='Overlay'>
      <div className="w-full h-full min-h-screen bg-[url(/img/identidad1.png)] bg-cover flex flex-col items-center justify-center">
        <TestEstadisticaApp />
      </div>
    </EncuestaEstudianteProvider>
  )
}
