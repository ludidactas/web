'use client'

import { ReactNode, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ModoPartida } from '@/wss/validators/go'

const OPCIONES: { modo: ModoPartida; titulo: string; descripcion: string }[] = [
  { modo: 'partida', titulo: 'Partida', descripcion: 'Go completo: se cuenta territorio al final.' },
  { modo: 'atari', titulo: 'Atari Go', descripcion: 'Empieza con cuatro piedras en cruz. Gana quien captura primero.' },
]

/**
 * Envuelve al botón "Invitar" (`children`, que hace de trigger): al apretarlo pregunta qué se va a
 * jugar y llama a `onElegir` con el modo escogido.
 */
export function ElegirModoInvitacion({
  children,
  nombre,
  onElegir,
}: {
  children: ReactNode
  nombre: string
  onElegir: (modo: ModoPartida) => void
}) {
  const [abierto, setAbierto] = useState(false)

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col items-center rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-center leading-6">¿A qué querés jugar con {nombre}?</DialogTitle>
          <DialogDescription className="sr-only">Elegí el tipo de desafío</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {OPCIONES.map((o) => (
            <DialogClose asChild key={o.modo}>
              <button
                className="flex flex-1 flex-col items-center gap-1 rounded-xl border-2 border-indigo-200 p-4 text-center hover:border-indigo-500 hover:bg-indigo-50"
                onClick={() => onElegir(o.modo)}
              >
                <span className="text-lg font-bold">{o.titulo}</span>
                <span className="text-sm text-slate-600">{o.descripcion}</span>
              </button>
            </DialogClose>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
