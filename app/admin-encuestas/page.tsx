'use client'

import EncuestasAdmin from '@/app/admin-encuestas/componentes/encuestas-admin'
import { Toaster } from '@/components/ui/sonner'
import { EncuestaAdminProvider } from './componentes/encuestas-admin-context'

export default function Page() {
  return (
    <EncuestaAdminProvider>
      <Toaster/>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <div className="p-2 sm:p-8 w-4/5">
          <EncuestasAdmin />
        </div>

        <div className="w-full h-24" />
      </div>
    </EncuestaAdminProvider>
  )
}