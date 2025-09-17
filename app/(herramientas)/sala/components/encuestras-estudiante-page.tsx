'use client'

import { useEffect, useRef, useState } from 'react'
import EncuestasEstudiante from './encuestas-estudiante'
import { EncuestaEstudianteProvider } from './encuestas-estudiante-context'
import HeaderSala from './header-sala'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

export default function EncuestasEstudiantePage({ idSala }: { idSala: string }) {
  // const [nombre, setNombre] = useState<string | undefined>(localStorage.getItem(`encuestas-nombre-${idSala}`) ?? undefined)
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
    return <p>Cargando...</p>
  }

  if (status==='unauthenticated' && !nombre) {
    return (
      <Dialog open>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ingresá tu nombre ✨</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
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
          <DialogFooter>
            <Button type="button" onClick={handleConectarse}>
              Conectarse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  
  return (
    <EncuestaEstudianteProvider idSala={idSala} nombre={nombreFinal} icono="streamline-pixel:pet-animals-cat">
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <HeaderSala className="flex gap-2" />
        <div className="p-2 w-[inherit] md:p-8 md:w-4/5">
          <EncuestasEstudiante />
        </div>
      </div>
    </EncuestaEstudianteProvider>
  )
}

