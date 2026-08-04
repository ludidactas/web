'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { SwitchCard } from '@/components/ui/switch-card'
import { MetodosLogin } from '@/wss/validators/auth'
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
import { storeSalas } from '@/wss-cli/stores/salas-store'
import { StatusDeConexion } from '@/wss-cli/conexion-wss'
import { LdSvg } from '@/components/custom/ld-svg'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Pencil, Trash2 } from 'lucide-react'
import type { SalaResumen } from '@/wss-cli/stores/salas-store'
import IlustSalas from '@/svg/dist/salas/IlustracionSalas.svg'
import { Outlined } from '@/components/fx/filtros'

type FormState = {
  nombre: string
  metodoLogin: MetodosLogin
  listaActiva: boolean
  soloInvitados: boolean
  lista: string[]
  nombres: Record<string, string>
}

const FORM_INICIAL: FormState = {
  nombre: '',
  metodoLogin: MetodosLogin.Nombre,
  listaActiva: false,
  soloInvitados: false,
  lista: [],
  nombres: {},
}

// Carga mínima tras "Crear": el OK llega cuando ocurre lo último entre la confirmación y este lapso.
const CARGA_MINIMA_MS = 300

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function FormCrearSala() {
  const router = useRouter()
  const { crearSala, estado } = useConexionProfe()
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [creando, startCreacion] = useTransition()

  const conectando = estado === StatusDeConexion.Conectando
  const pideDni = form.metodoLogin === MetodosLogin.DNI
  const nombreValido = form.nombre.trim().length > 0
  const razonDisabled = conectando
    ? 'Conectando...'
    : creando
    ? 'Creando la sala...'
    : !nombreValido
    ? 'Ingresá un nombre para la sala'
    : null

  const handleCrear = () => {
    if (razonDisabled) return
    startCreacion(async () => {
      try {
        // El OK se muestra cuando ocurre lo último entre la confirmación y el piso de carga.
        const [idSala] = await Promise.all([
          crearSala({
            config: {
              metodo_login: form.metodoLogin,
              solo_invitados: form.soloInvitados,
              nombre: form.nombre.trim(),
              listaPermitidos: form.lista,
            },
          }),
          delay(CARGA_MINIMA_MS),
        ])
        toast.success('Sala creada con éxito')
        router.push(`/salas/${idSala}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'No se pudo crear la sala')
      }
    })
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
    <div className={cn('flex flex-col justify-center gap-2 sm:my-4 w-full px-4 sm:px-20')}>
      <h2 className={cn('text-xl font-bold text-center leading-6 my-4')}>Configuración de la sala</h2>
      <div className={cn('flex items-center justify-between gap-4')}>
        <Input
          type="text"
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          placeholder="Ingresa el nombre de la sala"
          className={cn('h-10 text-xs sm:text-lg sm:py-2 w-full')}
        />
      </div>

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
            className={cn('flex flex-col gap-2')}
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
                  className={cn('flex flex-col gap-2 pt-2')}
                >
                  <SwitchCard
                    title="Permitir ingreso sólo a invitadxs"
                    description="Sólo quienes están en tu lista de invitadxs pueden ingresar a la sala"
                    checked={form.soloInvitados}
                    onCheckedChange={() => setForm((f) => ({ ...f, soloInvitados: !f.soloInvitados }))}
                  />

                  <div className="flex border rounded flex-col items-center gap-2 max-h-72 mt-2">
                    <h1 className="font-bold my-2">Lista de Invitadxs</h1>
                    <div className="flex flex-col gap-2 sm:flex-row w-full p-2 ">
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

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="self-center" tabIndex={razonDisabled ? 0 : -1}>
            <button
              className={cn(
                'mt-2 px-6 py-2 text-white text-xl border-2 bg-teal-500 rounded-full transition-opacity',
                razonDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
              )}
              onClick={handleCrear}
              disabled={!!razonDisabled}
            >
              {creando ? 'Creando...' : conectando ? 'Conectando...' : 'Crear e ingresar'}
            </button>
          </span>
        </TooltipTrigger>
        {razonDisabled && <TooltipContent>{razonDisabled}</TooltipContent>}
      </Tooltip>
    </div>
  )
}

function Cuenta() {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold">Tu cuenta</h2>
      <p>
        Haz ingresado a <span className="font-bold">Salas </span>con los siguientes datos
      </p>
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
        <p className="text-muted-foreground m-20">No hay sesión activa.</p>
      )}
    </div>
  )
}

function FilaSala({
  sala,
  onRenombrar,
  onEliminar,
}: {
  sala: SalaResumen
  onRenombrar: (id: string, nuevoNombre: string) => void
  onEliminar: (id: string) => Promise<void>
}) {
  const nombre = sala.nombre || `Sala ${sala.id}`
  const [renombrarAbierto, setRenombrarAbierto] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState(sala.nombre ?? '')
  const nuevoNombreValido = nuevoNombre.trim().length > 0
  const [eliminarAbierto, setEliminarAbierto] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const handleConfirmarRenombrar = () => {
    if (!nuevoNombreValido) return
    onRenombrar(sala.id, nuevoNombre.trim())
    setRenombrarAbierto(false)
  }

  const handleConfirmarEliminar = () => {
    setEliminando(true)
    onEliminar(sala.id)
      .then(() => setEliminarAbierto(false))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'No se pudo eliminar la sala'))
      .finally(() => setEliminando(false))
  }

  return (
    <li className={cn('flex items-center gap-2 rounded-xl border bg-white/60 overflow-hidden')}>
      <Link
        href={`/salas/${sala.id}`}
        className={cn('flex-1 px-4 py-3 font-medium hover:bg-slate-50 transition-colors')}
      >
        {nombre}
      </Link>
      <div className={cn('flex items-center gap-1 pr-2')}>
        <Dialog
          open={renombrarAbierto}
          onOpenChange={(abierto) => {
            setRenombrarAbierto(abierto)
            if (abierto) setNuevoNombre(sala.nombre ?? '')
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Renombrar</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent aria-description="Renombrar la sala">
            <DialogHeader>
              <DialogTitle>Renombrar sala</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmarRenombrar()}
              placeholder="Nombre de la sala"
            />
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleConfirmarRenombrar} disabled={!nuevoNombreValido}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={eliminarAbierto} onOpenChange={(abierto) => !eliminando && setEliminarAbierto(abierto)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Eliminar</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent aria-description="Confirmar eliminación de la sala">
            <DialogHeader>
              <DialogTitle>¿Eliminar la sala {nombre}?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Se va a desconectar a todos los que estén participando, y se va a borrar toda su data (estudiantes,
              asistencia, encuestas). Esta acción no se puede deshacer.
            </p>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={eliminando}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleConfirmarEliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </li>
  )
}

function VerSalas() {
  const { estado, renombrarSala, eliminarSala } = useConexionProfe()
  const salas = storeSalas((s) => s.salas)

  // "Quieto" ya no implica "cargando": si el profe no tiene sala, el socket se queda quieto a propósito
  // (recién conecta cuando aprieta "Crear"), así que no hay nada por lo que esperar.
  const cargando = salas === null || estado === StatusDeConexion.Quieto || estado === StatusDeConexion.Conectando

  if (cargando) return <p className={cn('p-4 text-muted-foreground')}>Cargando...</p>

  if (salas.length === 0)
    return <p className={cn('flex p-10 text-muted-foreground justify-center')}>No tenés ninguna sala creada todavía.</p>

  return (
    <div className={cn('p-10 flex flex-col gap-3')}>
      <p className={cn('text-2xl')}>Tus salas:</p>
      <ul className={cn('flex flex-col gap-2')}>
        {salas.map((sala) => (
          <FilaSala key={sala.id} sala={sala} onRenombrar={renombrarSala} onEliminar={eliminarSala} />
        ))}
      </ul>
    </div>
  )
}

export default function SalasPageClient({ idSalaInicial }: { idSalaInicial: string | null }) {
  const [activo, setActivo] = useState<'crear' | 'ver' | 'cuenta'>('ver')
  const { estado, listarSalas } = useConexionProfe()

  useEffect(() => {
    if (estado === StatusDeConexion.Conectado) listarSalas()
  }, [estado, listarSalas])

  return (
    <SidebarProvider
      className="flex-none sm:flex-1 flex-col sm:flex-row px-0 my-0 sm:px-20 sm:my-6 rounded-xl -mt-4 sm:mt-0"
      style={{ minHeight: 0 }}
    >
      <Sidebar
        className="sm:rounded-l sm:rounded-t-none p-4 w-full sm:w-fit h-auto sm:h-full bg-indigo-500 text-white"
        collapsible="none"
      >
        <SidebarContent>
          <SidebarHeader className="flex-row items-center gap-4 sm:flex-col sm:items-start">
            <LdSvg className="w-24 shrink-0 sm:hidden" SvgComponent={IlustSalas} />
            <div className="flex flex-col">
              <Outlined outlineColor="white" className="text-cyan-500 text-5xl sm:text-7xl">
                Salas
              </Outlined>
              <Outlined outlineColor="white" radius={2} className="text-black font-bold text-md sm:text-xl">
                Crea una sala y compartela con otrxs
              </Outlined>
            </div>
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
        <SidebarFooter>
          <LdSvg className="hidden sm:block sm:w-52" SvgComponent={IlustSalas} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="rounded min-h-0 overflow-y-auto">
        {activo === 'ver' && <VerSalas />}
        {activo === 'cuenta' && <Cuenta />}
        <div className={activo !== 'crear' ? 'hidden' : ''}>
          <FormCrearSala />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
