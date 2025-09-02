import EncuestasEstudiante from '../components/encuestas-estudiante'
import { EncuestaEstudianteProvider } from '../components/encuestas-estudiante-context'
import HeaderSala from '../components/header-sala'

export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    // <div className="bg-gradient-to-r from-cyan-200/70 to-indigo-200/70 h-full w-full">
      <EncuestaEstudianteProvider idSala={idSala}>
        <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
          <HeaderSala className="flex gap-2"></HeaderSala>

          <div className="p-2 w-[inherit] md:p-8 md:w-4/5">
            <EncuestasEstudiante />
          </div>

          {/* <div className="w-full h-24" /> */}
        </div>
        
      </EncuestaEstudianteProvider>
    // </div>
  )
}
