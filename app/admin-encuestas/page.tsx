'use client'

import EncuestasAdmin from '@/app/admin-encuestas/componentes/encuestas-admin'
import { EncuestaProvider } from '@/app/admin-encuestas/componentes/encuestas-context'
import { Toaster } from '@/components/ui/sonner'

export default function Page() {
  return (
    <EncuestaProvider>
      <Toaster/>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <div className="p-8 w-4/5">
          <EncuestasAdmin />
        </div>

        <div className="w-full h-24" />
      </div>
    </EncuestaProvider>
  )
}