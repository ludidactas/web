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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { SwitchCard } from '@/components/ui/switch-card'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storePermitidos } from '@/wss-cli/stores/permitidos-store'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { AccesoSala, MetodosLogin } from '@/wss/validators/auth'
import { cn } from '@/lib/utils'
import { OPCIONES_ACCESO, OPCIONES_IDENTIDAD } from '../opciones-sala'
import { SeccionLista } from './seccion-lista'
import { SelectorCondicionDeAsistencia } from './condicion-asistencia'

/** La identidad y el acceso de la sala: se eligen al crearla y no se cambian. */
function EleccionesFijas({ metodo, acceso }: { metodo: MetodosLogin; acceso: AccesoSala }) {
  const filas = [
    { etiqueta: 'Identidad', opcion: OPCIONES_IDENTIDAD[metodo] },
    { etiqueta: 'Acceso', opcion: OPCIONES_ACCESO[acceso] },
  ]
  return (
    <div className={cn('flex flex-col gap-2 rounded-lg border bg-slate-50 p-3')}>
      {filas.map(({ etiqueta, opcion: { titulo, descripcion, icono: Icono } }) => (
        <div key={etiqueta} className={cn('flex items-start gap-3')}>
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white')}>
            <Icono className={cn('h-4 w-4')} aria-hidden />
          </span>
          <div className={cn('flex flex-col')}>
            <span className={cn('text-sm font-semibold leading-tight')}>
              {etiqueta}: {titulo}
            </span>
            <span className={cn('text-xs text-muted-foreground')}>{descripcion}</span>
          </div>
        </div>
      ))}
      <p className={cn('text-xs text-muted-foreground')}>
        La identidad y el acceso se eligen al crear la sala y no se pueden cambiar.
      </p>
    </div>
  )
}

export default function PanelConfigSala({ children }: PropsWithChildren) {
  const { actualizarConfig, agregarPermitidos, removerPermitidos, borrarListaPermitidos } = useConexionProfe()
  const { config } = storeConfig()
  const { lista: listaPermitidos, nombres } = storePermitidos()

  const acceso = config?.acceso ?? AccesoSala.Libre

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={cn('flex flex-col items-center')} aria-description="Configuración de la sala">
        <DialogHeader>
          <DialogTitle className={cn('text-center leading-6')}>Configuración de la sala</DialogTitle>
        </DialogHeader>
        <div className={cn('flex flex-col gap-4 w-full')}>
          {config && <EleccionesFijas metodo={config.metodo_login} acceso={acceso} />}

          {config && acceso !== AccesoSala.Libre && (
            <SeccionLista
              metodo={config.metodo_login}
              acceso={acceso}
              lista={listaPermitidos}
              nombres={nombres}
              onAgregar={agregarPermitidos}
              onRemover={(entrada) => removerPermitidos([entrada])}
              onBorrar={borrarListaPermitidos}
            />
          )}

          <SelectorCondicionDeAsistencia
            condicion={config?.condicion_asistencia ?? null}
            onChange={(condicion_asistencia) => actualizarConfig({ condicion_asistencia })}
          />

          <SwitchCard
            title="Almacenar en mi Drive los resultados de las partidas de Go"
            description="Al finalizar cada partida de Go de tus estudiantes, se almacenerá una imagen del tablero con la información del resultado"
            checked={config?.guardar_partidas_drive ?? false}
            onCheckedChange={() => actualizarConfig({ guardar_partidas_drive: !config?.guardar_partidas_drive })}
          />
        </div>
      </DialogContent>
    </Dialog>
  )

  // if (isMobile) {
  //   return (
  //     <Drawer>
  //       <DrawerTrigger asChild>{children}</DrawerTrigger>
  //       <DrawerContent aria-description="Configuración de la sala">
  //         <DrawerHeader>
  //           <DrawerTitle className={cn('text-center leading-6')}>Configuración de la sala</DrawerTitle>
  //         </DrawerHeader>
  //         <div className={cn('flex flex-col items-center gap-2 px-4 pb-2 overflow-y-auto max-h-[65vh]')}>
  //           {contenido}
  //         </div>
  //         <DrawerFooter>
  //           <DrawerClose asChild>
  //             <p className={cn('px-4 py-2 text-white text-xl border-2 bg-teal-500 rounded-full text-center')}>
  //               Cerrar
  //             </p>
  //           </DrawerClose>
  //         </DrawerFooter>
  //       </DrawerContent>
  //     </Drawer>
  //   )
  // }

  // return (
  //   <Dialog>
  //     <DialogTrigger asChild>{children}</DialogTrigger>
  //     <DialogContent className={cn('flex flex-col items-center')} aria-description="Configuración de la sala">
  //       <DialogHeader>
  //         <DialogTitle className={cn('text-center leading-6')}>Configuración de la sala</DialogTitle>
  //       </DialogHeader>
  //       {contenido}

  //       <DialogFooter>
  //         <DialogClose>
  //           <p className={cn('px-4 py-2 text-white text-xl border-2 bg-teal-500 rounded-full')}>Cerrar</p>
  //         </DialogClose>
  //       </DialogFooter>
  //     </DialogContent>
  //   </Dialog>
  // )
}
