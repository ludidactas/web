import TestEstadisticaApp from './components/estadistica-svg-claude'

export default async function OverlayEncuestas({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <div className="w-full h-full min-h-screen flex flex-col items-center justify-center">
      {idSala}
      <TestEstadisticaApp />
    </div>
  )
}
