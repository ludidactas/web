'use client'

import EncuestasCliente from '@/app/(herramientas)/encuestas/components/encuestas-cliente'
import { EncuestaEstudianteProvider } from './components/encuestas-estudiante-context'

export default function Page() {
  return (
    <EncuestaEstudianteProvider>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <div className="p-8 w-4/5">
          <EncuestasCliente />
        </div>

        <div className="w-full h-24" />
      </div>
    </EncuestaEstudianteProvider>
  )
}
