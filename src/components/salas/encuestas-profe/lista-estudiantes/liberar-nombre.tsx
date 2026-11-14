'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react/dist/iconify.js'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'

/**
 * Acción del profe sobre un estudiante de una sala por nombre: libera su nombre para que otra persona o
 * dispositivo pueda reclamarlo. Pide confirmación y ofrece borrar también lo asociado al nombre.
 */
export function LiberarNombre({ nombre }: { nombre: string }) {
  const { liberarNombre } = useConexionProfe()
  const [abierto, setAbierto] = useState(false)
  const [borrarDatos, setBorrarDatos] = useState(false)

  const confirmar = () => {
    liberarNombre(nombre, borrarDatos)
    setAbierto(false)
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Liberar el nombre ${nombre}`}
            className="cursor-pointer text-gray-500 hover:text-cyan-500"
            onClick={() => {
              setBorrarDatos(false)
              setAbierto(true)
            }}
          >
            <Icon icon="lucide:user-round-x" width={18} height={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          <p className="text-xs">
            Libera este nombre para que otra persona o dispositivo pueda usarlo. Si está conectado, se lo desconecta.
          </p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent aria-description="Confirmar la liberación del nombre">
          <DialogHeader>
            <DialogTitle>¿Liberar el nombre {nombre}?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Quien lo tenga reservado se desconecta, y el próximo que ingrese con ese nombre lo reclama.
          </p>
          <div className="flex items-start gap-2">
            <Checkbox id="borrar-datos" checked={borrarDatos} onCheckedChange={(v) => setBorrarDatos(v === true)} />
            <Label htmlFor="borrar-datos" className="flex flex-col gap-1 font-normal leading-snug">
              Borrar también sus votos y su asistencia
              <span className="text-xs text-muted-foreground">Esta acción no se puede deshacer.</span>
            </Label>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant={borrarDatos ? 'destructive' : 'default'} onClick={confirmar}>
              Liberar nombre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
