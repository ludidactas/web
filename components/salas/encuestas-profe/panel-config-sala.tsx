import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SwitchCard } from '@/components/ui/switch-card'
import { PropsWithChildren } from 'react'
import { useEncuestaProfe } from './encuestas-profe-context'

export default function PanelConfigSala({ children }: PropsWithChildren) {
  const { configSala, actualizarConfig } = useEncuestaProfe()

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="flex flex-col items-center" aria-description="Configuración de la sala">
        <DialogHeader>
          <DialogTitle className="text-center leading-6">Configuración de la sala</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <pre className="text-xs">{JSON.stringify(configSala, null, 2)}</pre>
          <SwitchCard
            title="DNI obligatorio"
            description="Los participantes tienen que ingresar DNI para participar"
            checked={configSala?.pedir_dni}
            onCheckedChange={() => {
              actualizarConfig({ pedir_dni: !configSala?.pedir_dni })
            }}
          />
        </div>
        <DialogFooter>
          <DialogClose>
            <p className="px-4 py-2 min-w-40 text-xl rounded-full">Cerrar</p>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
