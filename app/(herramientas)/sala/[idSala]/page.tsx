import EncuestasEstudiante from '../components/encuestas-estudiante'
import { EncuestaEstudianteProvider } from '../components/encuestas-estudiante-context'
import HeaderSala from '../components/header-sala'
import Image from 'next/image'
import { titulo } from '@/components/fonts'

export default async function Page({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  return (
    <EncuestaEstudianteProvider idSala={idSala}>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <HeaderSala className='flex gap-2'>
          <div className="md:flex md:flex-col font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
                    <Image
                      className="w-[200px] md:w-[800px]"
                      src="/img/lema_sketchy.gif"
                      alt={''}
                      width={200}
                      height={200}
                    />
                    <p className={`${titulo.className} m-0 text-nowrap text-[1.5em]`}>Educación emergente </p>
                  </div>
        </HeaderSala>

        <div className="p-2 w-[inherit] md:p-8 md:w-4/5">
          <EncuestasEstudiante />
        </div>

        {/* <div className="w-full h-24" /> */}
      </div>
    </EncuestaEstudianteProvider>
  )
}
