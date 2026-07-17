'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { SwitchCard } from '@/components/ui/switch-card'
import { MetodosLogin } from '@/wss/validators/auth'
import Link from 'next/link'
import Image from 'next/image'
import { ListaInvitadosForm, ListaPermitidosForm } from '@/components/salas/encuestas-profe/lista-invitados-form'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { StatusDeConexion } from '@/wss-cli/conexion-wss'
import { useSession } from 'next-auth/react'
import { LdSvg } from '@/components/custom/ld-svg'
import IlustSalas from '@/svg/dist/salas/IlustracionSalas.svg'
import { Outlined } from '@/components/fx/filtros'

type FormState = {
  metodoLogin: MetodosLogin
  listaActiva: boolean
  soloInvitados: boolean
  lista: string[]
  nombres: Record<string, string>
}

function FormCrearSala() {
  const router = useRouter()
  const { crearSala, estado, conectar } = useConexionProfe()
  const idSala = storeConfig((s) => s.idSala)

  const [form, setForm] = useState<FormState>({
    metodoLogin: MetodosLogin.Nombre,
    listaActiva: false,
    soloInvitados: false,
    lista: [],
    nombres: {},
  })
  const [creando, setCreando] = useState(false)

  // Navegar cuando sala:abierta llega tras emitir sala:crear
  useEffect(() => {
    if (creando && idSala) {
      router.push(`/salas/${idSala}`)
    }
  }, [creando, idSala, router])

  // Recién cuando el socket (que arrancamos a mano en handleCrear) termina de conectar, pedimos crear la sala
  useEffect(() => {
    if (creando && !idSala && estado === StatusDeConexion.Conectado) {
      crearSala({ config: { metodo_login: form.metodoLogin, solo_invitados: form.soloInvitados }, listaPermitidos: form.lista })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Solo nos interesa reaccionar a la transición a Conectado, no a cambios del form
  }, [creando, idSala, estado, crearSala])

  // Si falló la conexión (p.ej. WSS caído), no dejamos el botón trabado en "Creando..."
  useEffect(() => {
    if (creando && (estado === StatusDeConexion.Error || estado === StatusDeConexion.Rechazado)) {
      setCreando(false)
    }
  }, [creando, estado])

  const conectando = estado === StatusDeConexion.Conectando
  const pideDni = form.metodoLogin === MetodosLogin.DNI

  const handleCrear = () => {
    if (conectando || creando) return
    // Si ya tiene sala, navegar directo (igual que antes hacía crearSala con sala existente)
    if (idSala) {
      router.push(`/salas/${idSala}`)
      return
    }
    setCreando(true)
    // Recién acá arrancamos el socket, si todavía no está conectado (profe sin sala previa)
    if (estado === StatusDeConexion.Quieto) {
      conectar()
    } else if (estado === StatusDeConexion.Conectado) {
      crearSala({ config: { metodo_login: form.metodoLogin, solo_invitados: form.soloInvitados }, listaPermitidos: form.lista })
    }
  }

  const agregarALista = (dni: string, nombre?: string) => {
    if (form.lista.includes(dni)) return
    setForm((f) => ({
      ...f,
      lista: [...f.lista, dni],
      nombres: nombre ? { ...f.nombres, [dni]: nombre } : f.nombres,
    }))
  }

  return (
    <div className="flex flex-col justify-center gap-2 my-4 w-full px-20">
      <h2 className="text-xl font-bold text-center leading-6 my-6">Configuración de la sala</h2>

      <SwitchCard
        title="DNI obligatorio"
        description="Los participantes tienen que ingresar DNI para participar"
        checked={pideDni}
        onCheckedChange={() =>
          setForm((f) => ({
            ...f,
            metodoLogin: pideDni ? MetodosLogin.Nombre : MetodosLogin.DNI,
            listaActiva: false,
            soloInvitados: false,
            lista: [],
            nombres: {},
          }))
        }
      />

      <AnimatePresence initial={false}>
        {pideDni && (
          <motion.div
            key="lista-invitados-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', width: '100%' }}
            className="flex flex-col gap-2"
          >
            <SwitchCard
              title="Lista de Invitadxs"
              description="Podés cargar tu propia lista de invitadxs"
              checked={form.listaActiva}
              onCheckedChange={() => setForm((f) => ({ ...f, listaActiva: !f.listaActiva }))}
            />

            <AnimatePresence initial={false}>
              {form.listaActiva && (
                <motion.div
                  key="lista-detalle"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden', width: '100%' }}
                  className="flex flex-col gap-2 pt-2"
                >
                  <SwitchCard
                    title="Permitir ingreso sólo a invitadxs"
                    description="Sólo quienes están en tu lista de invitadxs pueden ingresar a la sala"
                    checked={form.soloInvitados}
                    onCheckedChange={() => setForm((f) => ({ ...f, soloInvitados: !f.soloInvitados }))}
                  />

                  <div className="flex border rounded flex-col items-center gap-2 max-h-72 mt-2">
                    <h1 className="font-bold my-2">Lista de Invitadxs</h1>
                    <div className="flex w-full">
                      <ListaInvitadosForm onAgregar={agregarALista} />
                      <ListaPermitidosForm
                        lista={form.lista}
                        nombres={form.nombres}
                        onRemover={(dni) => setForm((f) => ({ ...f, lista: f.lista.filter((d) => d !== dni) }))}
                        onBorrar={() => setForm((f) => ({ ...f, lista: [], nombres: {} }))}
                        onAgregarCSV={(nuevos) => nuevos.forEach((d) => agregarALista(d))}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className={cn(
          'mt-4 px-6 py-2 text-white text-xl border-2 bg-teal-500 rounded-full self-center transition-opacity',
          (conectando || creando) && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleCrear}
        disabled={conectando || creando}
      >
        {creando ? 'Creando...' : conectando ? 'Conectando...' : 'Crear'}
      </button>
    </div>
  )
}

function Cuenta() {
  const { data: session } = useSession()
  const user = session?.user

  return (<div className='p-10'>
      <h2 className="text-2xl font-bold">Tu cuenta</h2>
      <p>Haz ingresado a <span className='font-bold'>Salas </span>con los siguientes datos</p>
      {user ? (
        <div className="flex flex-col m-10 gap-4 bg-slate-100 w-fit p-4 rounded">
          <div className="flex items-center gap-4">
            {user.image && <Image className="rounded-full" src={user.image} alt="Avatar" width={64} height={64} />}
            <div className="flex flex-col gap-1">
              <p className="font-semibold">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">No hay sesión activa.</p>
      )}
   </div>
  )
}

function BotonEliminarSala({ idSala }: { idSala: string }) {
  const { eliminarSala } = useConexionProfe()
  const [eliminando, setEliminando] = useState(false)

  const handleEliminar = () => {
    setEliminando(true)
    eliminarSala()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 border rounded-full text-center text-red-600 border-red-600 hover:bg-red-50 transition-colors w-fit">
          Eliminar sala
        </button>
      </DialogTrigger>
      <DialogContent aria-description="Confirmar eliminación de la sala">
        <DialogHeader>
          <DialogTitle>¿Eliminar la sala {idSala}?</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          Se va a desconectar a todos los que estén participando, y se va a borrar toda su data (estudiantes,
          asistencia, encuestas). Esta acción no se puede deshacer.
        </p>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <button className="px-4 py-2 border rounded-full">Cancelar</button>
          </DialogClose>
          <DialogClose asChild>
            <button
              className="px-4 py-2 text-white rounded-full bg-red-600 disabled:opacity-50"
              onClick={handleEliminar}
              disabled={eliminando}
            >
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VerSalas() {
  const { estado } = useConexionProfe()
  const idSala = storeConfig((s) => s.idSala)

  // "Quieto" ya no implica "cargando": si el profe no tiene sala, el socket se queda quieto a propósito
  // (recién conecta cuando aprieta "Crear"), así que no hay nada por lo que esperar.
  if (!idSala && estado === StatusDeConexion.Conectando) return <p className="p-4 text-muted-foreground">Cargando...</p>

  if (!idSala) return <p className="p-4 text-muted-foreground">No tenés ninguna sala creada todavía.</p>

  return (
    <div className="p-10 flex flex-col gap-2">
      <p className="text-2xl">Tus salas activas:</p>
      <div className="flex items-center gap-2">
        <Link
          href={`/salas/${idSala}`}
          className="px-4 py-2 border rounded-full text-center hover:bg-slate-50 transition-colors w-fit"
        >
          Ir a la sala {idSala}
        </Link>
        <BotonEliminarSala idSala={idSala} />
      </div>
    </div>
  )
}

export default function SalasPageClient({ idSalaInicial }: { idSalaInicial: string | null }) {
  const [activo, setActivo] = useState<'crear' | 'ver' | 'cuenta'>('ver')

  // Precargamos el store con lo que ya sabíamos desde el server (sin esperar al socket)
  useEffect(() => {
    if (idSalaInicial) storeConfig.getState().setIdSala(idSalaInicial)
  }, [idSalaInicial])

  return (<>

    <SidebarProvider className="flex-1 px-20 my-6 rounded-xl" style={{ minHeight: 0 }}>
      <Sidebar className="rounded-l p-4 w-fit bg-indigo-500 text-white" collapsible="none">
        <SidebarContent>
          <SidebarHeader>
              <Outlined outlineColor='white' className='text-cyan-500 text-7xl'>Salas</Outlined>
          <Outlined outlineColor='white' radius={2} className='text-black font-bold text-xl'>Crea una sala y compartela con otrxs</Outlined>
          </SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activo === 'ver'}
                onClick={() => setActivo('ver')}
                className={activo === 'ver' ? 'bg-white/40 font-semibold' : ''}
              >
                Ver Salas
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activo === 'crear'}
                onClick={() => setActivo('crear')}
                className={activo === 'crear' ? 'bg-white/40 font-semibold' : ''}
              >
                Crear sala
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activo === 'cuenta'}
                onClick={() => setActivo('cuenta')}
                className={activo === 'cuenta' ? 'bg-white/40 font-semibold' : ''}
              >
                Cuenta
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className=''>
         <LdSvg className="w-52" SvgComponent={IlustSalas} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="rounded">
        {activo === 'ver' && <VerSalas />}
        {activo === 'cuenta' && <Cuenta />}
        <div className={activo !== 'crear' ? 'hidden' : ''}>
          <FormCrearSala />
        </div>
      </SidebarInset>
    </SidebarProvider>
  </>
  )
}
