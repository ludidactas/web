import { estadisticaSvgConfigValidator } from "@/components/salas/overlay/estadistica-svg-config"
import TestEstadisticaApp from '@/components/salas/overlay/estadistica-svg'
import { EncuestaEstudianteProvider } from "@/components/salas/encuestas-estudiante/encuestas-estudiante-context"

export default async function OverlayEncuestas({ params, searchParams }: {
  params: Promise<{ idSala: string }>,
  searchParams: Promise<unknown>
}) {
  const { idSala } = await params

  // Validar
  const { data, success, error } = estadisticaSvgConfigValidator.safeParse(await searchParams)

  return (
    <EncuestaEstudianteProvider idSala={idSala} nombre="Overlay">
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center">
        {success && <TestEstadisticaApp config={data} />}
        {!success && <p className="text-red-700">Error en configuración: {error.message}</p>}
      </div>
    </EncuestaEstudianteProvider>
  )
}
