import { estadisticaSvgConfigValidator } from '@/components/salas/overlay/estadistica-svg-config'
import EstadisticaSvg from '@/components/salas/overlay/estadistica-svg'
import { ConexionOverlayProvider } from '@/wss-cli/providers/wss-overlay-context'

export default async function OverlayEncuestas({
  params,
  searchParams,
}: {
  params: Promise<{ idSala: string }>
  searchParams: Promise<unknown>
}) {
  const { idSala } = await params

  // Validar
  const { data, success, error } = estadisticaSvgConfigValidator.safeParse(await searchParams)

  return (
    <ConexionOverlayProvider auth={{ idSala }}>
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center">
        {success && <EstadisticaSvg config={data} />}
        {!success && <p className="text-red-700">Error en configuración: {error.message}</p>}
      </div>
    </ConexionOverlayProvider>
  )
}
