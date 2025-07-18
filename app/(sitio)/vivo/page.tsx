'use client'

import EncuestasCliente from '@/components/encuestas/encuestas-cliente'
import { EncuestaProvider } from '@/components/encuestas/SocketProvider'

export default function Page() {
  return (
    <EncuestaProvider>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <div className="p-8 w-4/5">
          <EncuestasCliente />
        </div>

        <div className="w-full h-24" />
      </div>
    </EncuestaProvider>
  )
}
