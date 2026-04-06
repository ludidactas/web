import { PropsWithChildren } from 'react'

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

import { storeConfig } from '@/wss-cli/stores/config-store'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'

export default function PanelConfigSala({ children }: PropsWithChildren) {
  const { actualizarConfig } = useConexionProfe()
  const { config } = storeConfig()

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col items-center" aria-description="Configuración de la sala">
        <DialogHeader>
          <DialogTitle className="text-center leading-6">Configuración de la sala</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {/* Debug: */}
          {/* <pre className="text-xs">{JSON.stringify(configSala, null, 2)}</pre> */}

          <SwitchCard
            title="DNI obligatorio"
            description="Los participantes tienen que ingresar DNI para participar"
            checked={config?.pedir_dni}
            onCheckedChange={() => {
              actualizarConfig({ pedir_dni: !config?.pedir_dni })
            }}
          />
        </div>
        <DialogFooter>
          <DialogClose>
            <p className="px-4 py-2 text-white text-xl border-2 bg-teal-500 rounded-full">Cerrar</p>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
