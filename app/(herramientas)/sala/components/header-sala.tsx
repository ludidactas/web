'use client'
import Image from 'next/image'
import { PropsWithChildren, useContext } from 'react'
import { titulo } from '@/components/fonts'
// import { useEncuestaEstudiante } from './encuestas-estudiante-context'
import { nombre as nombresplit } from '@/lib/utils'
import { EncuestaEstudianteContext } from './encuestas-estudiante-context'
import { Iconito } from '@/components/custom/ld-icon'

interface HeaderProps extends PropsWithChildren {
  className?: string,
}

export default function HeaderSala({ className, children }: HeaderProps) {
  //Trae el contexto de encuestas estudiantes pero no tira un error si el nombre no existe
  let nombre: string | undefined

  try {
    // usa directamente useContext y maneja el caso en el cual pueda no existir
    const context = useContext(EncuestaEstudianteContext)
    nombre = context?.nombre
  } catch (error: any) {
    // Si el contexto no existe o el componente esta por fuera del provider, no pasa na
    console.warn(error)
    nombre = undefined
  }
  
  return (
    <div className={`${className} bg-white md:m-4 w-screen px-2 md:px-4 py-6 items-center grid grid-cols-3`}>
      <div className="flex md:w-[20em] items-center gap-4">
        <Image className="w-10 ml-4 md:ml-0 md:w-16" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
        <div className="flex flex-col font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
          <Image
            className="w-[150px] md:w-[800px]"
            src="/img/lema_sketchy.gif"
            alt={''}
            width={200}
            height={200}
          />
          <p className={`${titulo.className} m-0 text-nowrap md:text-[1em]`}>Educación emergente </p>
        </div>

      </div>
        {nombre && <p className=' flex justify-center gap-2 text-4xl'>
          Hola {nombresplit(nombre)}
          <Iconito icon={'streamline-pixel:hand-cross-finger-heart'}/>
          </p>}
      {children}
    </div>
  )
}