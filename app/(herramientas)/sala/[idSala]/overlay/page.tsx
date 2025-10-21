import { EncuestaEstudianteProvider } from '../../components/encuestas-estudiante-context'
import TestEstadisticaApp from './components/estadistica-svg-claude'
import { z } from 'zod'

// Validación de query params
const EstadisticaSvgConfigValidator = z.object({
  bg: z.string().optional().default('rgba(0, 0, 0, 0.4)'),
  barHeight: z.number().optional().default(40),
  barSpacing: z.number().optional().default(60),
  titleHeight: z.number().optional().default(40),
})

export type EstadisticaSvgConfig = z.infer<typeof EstadisticaSvgConfigValidator>

export default async function OverlayEncuestas({ params, searchParams }: {
  params: Promise<{ idSala: string }>,
  searchParams: Promise<unknown>
}) {
  const { idSala } = await params

  // Validar
  const { data, success, error } = EstadisticaSvgConfigValidator.safeParse(await searchParams)

  return (
    <EncuestaEstudianteProvider idSala={idSala} nombre="Overlay">
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center">
        {success && <TestEstadisticaApp config={data} />}
        {!success && <p className="text-red-700">Error en configuración: {error.message}</p>}
      </div>
    </EncuestaEstudianteProvider>
  )
}
