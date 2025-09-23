'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import EncuestasEstudiante from './encuestas-estudiante'
import { EncuestaEstudianteProvider } from './encuestas-estudiante-context'
import HeaderSala from './header-sala'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { IconoRandom } from '@/lib/iconos'
import { nombreSplit } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

export default function EncuestasEstudiantePage({ idSala, btnLogin, btnLogout }: { idSala: string, btnLogin: ReactNode, btnLogout: ReactNode }) {
  const [nombre, setNombre] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isClient, setIsClient] = useState(false)  
  const { data: nextSession, status } = useSession()

  const nombreFinal = status === 'authenticated' 
    ? nextSession?.user?.name || 'Usuario'
    : nombre

  useEffect(() => {
    setIsClient(true)
    const storedName = localStorage.getItem(`encuestas-nombre-${idSala}`)
    if (storedName) {
      setNombre(storedName)
    }
  }, [idSala])
  
  const handleConectarse = () => {
    const value = inputRef.current?.value?.trim()
    if (value) {
      setNombre(value)
      localStorage.setItem(`encuestas-nombre-${idSala}`, value)
    }
  }

  if (status==='loading' || !isClient){
    return <div className='w-screen h-screen place-content-center'>
      <p className='text-6xl text-indigo-500 text-center'>Cargando...</p>
      </div>
  }

  if (status==='unauthenticated' && !nombre) {
    return (
      <Dialog open>
        <DialogContent className="sm:max-w-md border-8 p-10 border-indigo-500/50">
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-indigo-500'>Ingresá tu nombre <Sparkles /></DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input className=' bg-indigo-100/50'
              id="nombre"
              ref={inputRef}
              defaultValue={nombre}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConectarse()
                }
              }}
            />
          </div>
          <DialogFooter className='flex gap-2 flex-col items-center justify-center'>
            <Button className='bg-indigo-500/90 font-semibold' type="button" onClick={handleConectarse}>
              Conectarse con nombre
            </Button>
            <span>o</span>
            {btnLogin}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  
  return (
    <EncuestaEstudianteProvider idSala={idSala} nombre={nombreFinal} icono={IconoRandom()}>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <HeaderSala className="flex gap-2" btnLogout={status==='authenticated' ?  btnLogout: undefined}>
          <p className='flex gap-2 justify-center items-center text-sm text-center sm:text-4xl'><Sparkles className=' w-4 md:w-10' />¡Hola {nombreSplit(nombreFinal)}!<Sparkles className='w-4 md:w-10'/></p>
        </HeaderSala>
        <div className="p-2 w-[inherit] md:p-8">
          <EncuestasEstudiante />
        </div>
      </div>
    </EncuestaEstudianteProvider>
  )
}

