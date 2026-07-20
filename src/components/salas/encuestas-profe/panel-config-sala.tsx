import { PropsWithChildren, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
import { useIsMobile } from '@/components/hooks/use-mobile'
import { SwitchCard } from '@/components/ui/switch-card'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storePermitidos } from '@/wss-cli/stores/permitidos-store'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { MetodosLogin } from '@/wss/validators/auth'
import { cn } from '@/lib/utils'
import { ListaInvitadosForm, ListaPermitidosForm } from './lista-invitados-form'

export default function PanelConfigSala({ children }: PropsWithChildren) {
  const isMobile = useIsMobile()
  const { actualizarConfig, agregarPermitidos, removerPermitidos, borrarListaPermitidos } = useConexionProfe()
  const { config } = storeConfig()
  const { lista: listaPermitidos, nombres } = storePermitidos()
  const [listaActiva, setListaActiva] = useState(listaPermitidos.length > 0 || !!config?.solo_invitados)
  const [nombre, setNombre] = useState(config?.nombre ?? '')

  useEffect(() => {
    setNombre(config?.nombre ?? '')
  }, [config?.nombre])

  const pideDni = config?.metodo_login === MetodosLogin.DNI

  const contenido = (
    <>
      <div className={cn('flex flex-col gap-2 w-full')}>
          <div className={cn('flex flex-col gap-1')}>
            <label className={cn('text-sm font-medium')}>Nombre de la sala</label>
            <input
              className={cn('border rounded px-3 py-1.5 text-sm w-full')}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => actualizarConfig({ nombre })}
              onKeyDown={(e) => e.key === 'Enter' && actualizarConfig({ nombre })}
              placeholder="Ingresá un nombre para la sala"
            />
          </div>
          <AnimatePresence initial={false}>
            {pideDni && (
              <motion.div
                key="lista-invitados-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden', width: '100%' }}
                className={cn('flex flex-col gap-2')}
              >
                <SwitchCard
                  title="Lista de Invitadxs"
                  description="Podés cargar tu propia lista de invitadxs"
                  checked={listaActiva}
                  onCheckedChange={() => setListaActiva((v) => !v)}
                />

                <AnimatePresence initial={false}>
                  {listaActiva && (
                    <motion.div
                      key="lista-detalle"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden', width: '100%' }}
                      className={cn('flex flex-col gap-2 pt-2')}
                    >
                      <SwitchCard
                        title="Permitir ingreso sólo a invitadxs"
                        description="Sólo quienes están en tu lista de invitadxs pueden ingresar a la sala"
                        checked={config?.solo_invitados}
                        onCheckedChange={() => actualizarConfig({ solo_invitados: !config?.solo_invitados })}
                      />

                      <div className={cn('flex border rounded flex-col items-center gap-2 max-h-72 mt-2')}>
                        <h1 className={cn('font-bold my-2')}>Lista de Invitadxs</h1>
                        <div className={cn('flex flex-col sm:flex-row w-full')}>
                          <ListaInvitadosForm
                            onAgregar={(dni, nombre) => {
                              agregarPermitidos([dni])
                              if (nombre) storePermitidos.getState().setNombre(dni, nombre)
                            }}
                          />
                          <ListaPermitidosForm
                            lista={listaPermitidos}
                            nombres={nombres}
                            onRemover={(dni) => removerPermitidos([dni])}
                            onBorrar={borrarListaPermitidos}
                            onAgregarCSV={(nuevos) => agregarPermitidos(nuevos)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </>
  )

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent aria-description="Configuración de la sala">
          <DrawerHeader>
            <DrawerTitle className={cn('text-center leading-6')}>Configuración de la sala</DrawerTitle>
          </DrawerHeader>
          <div className={cn('flex flex-col items-center gap-2 px-4 pb-2 overflow-y-auto max-h-[65vh]')}>
            {contenido}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <p className={cn('px-4 py-2 text-white text-xl border-2 bg-teal-500 rounded-full text-center')}>
                Cerrar
              </p>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={cn('flex flex-col items-center')} aria-description="Configuración de la sala">
        <DialogHeader>
          <DialogTitle className={cn('text-center leading-6')}>Configuración de la sala</DialogTitle>
        </DialogHeader>
        {contenido}

        <DialogFooter>
          <DialogClose>
            <p className={cn('px-4 py-2 text-white text-xl border-2 bg-teal-500 rounded-full')}>Cerrar</p>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
