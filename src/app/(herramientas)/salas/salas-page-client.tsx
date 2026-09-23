'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
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
import type { CondicionAsistencia } from '@/wss/validators/asistencia'
import { ListaInvitadosForm, ListaPermitidosForm } from '@/components/salas/encuestas-profe/lista-invitados-form'
import { SelectorCondicionDeAsistencia } from '@/components/salas/encuestas-profe/condicion-asistencia'
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
import { NavLink } from '@/components/navegacion/nav-link'
import { storeSalas } from '@/wss-cli/stores/salas-store'
import { StatusDeConexion, statusesDeCarga } from '@/wss-cli/conexion-wss'
import { LdSvg } from '@/components/custom/ld-svg'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CirclePlus, Pencil, Trash2 } from 'lucide-react'
import type { SalaResumen } from '@/wss-cli/stores/salas-store'
import IlustSalas from '@/svg/dist/salas/IlustracionSalas.svg'
import { Outlined } from '@/components/fx/filtros'
import { Icon } from '@iconify/react/dist/iconify.js'

type FormState = {
  nombre: string
  metodoLogin: MetodosLogin
  listaActiva: boolean
  soloInvitados: boolean
  lista: string[]
  nombres: Record<string, string>
  condicionAsistencia: CondicionAsistencia | null
}

const FORM_INICIAL: FormState = {
  nombre: '',
  metodoLogin: MetodosLogin.Nombre,
  listaActiva: false,
  soloInvitados: false,
  lista: [],
  nombres: {},
  condicionAsistencia: null,
}

// Carga mínima tras "Crear": el OK llega cuando ocurre lo último entre la confirmación y este lapso.
const CARGA_MINIMA_MS = 300

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function FormCrearSala() {
  const router = useRouter()
  const { crearSala, estado } = useConexionProfe()
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [creando, startCreacion] = useTransition()

  const cargandoConexion = statusesDeCarga.includes(estado)
  const pideDni = form.metodoLogin === MetodosLogin.DNI
  const nombreValido = form.nombre.trim().length > 0
  const razonDisabled = cargandoConexion
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
              nombresPermitidos: form.nombres,
              condicion_asistencia: form.condicionAsistencia,
            },
          }),
          delay(CARGA_MINIMA_MS),
        ])
        toast.success('Sala creada con éxito')
        router.push(`/salas/${idSala}/encuestas`)
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
                        onAgregarCSV={(nuevos) => nuevos.forEach(({ dni, nombre }) => agregarALista(dni, nombre))}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <SelectorCondicionDeAsistencia
        condicion={form.condicionAsistencia}
        onChange={(condicionAsistencia) => setForm((f) => ({ ...f, condicionAsistencia }))}
      />

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
              {creando ? 'Creando...' : cargandoConexion ? 'Conectando...' : 'Crear e ingresar'}
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
      <NavLink
        href={`/salas/${sala.id}/encuestas`}
        overlayMensaje="Renderizando sala..."
        className={cn('flex-1 px-4 py-3 font-medium hover:bg-slate-50 transition-colors')}
      >
        {nombre}
      </NavLink>
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
              <Button
                className="bg-ld-violeta hover:bg-ld-violeta-oscuro"
                onClick={handleConfirmarRenombrar}
                disabled={!nuevoNombreValido}
              >
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

function VerSalas({ onCrear }: { onCrear: () => void }) {
  const { estado, renombrarSala, eliminarSala } = useConexionProfe()
  const salas = storeSalas((s) => s.salas)

  // "Quieto" ya no implica "cargando": si el profe no tiene sala, el socket se queda quieto a propósito
  // (recién conecta cuando aprieta "Crear"), así que no hay nada por lo que esperar.
  const cargando = salas === null || estado === StatusDeConexion.Quieto || estado === StatusDeConexion.Conectando

  if (cargando) return <p className={cn('p-4 text-muted-foreground')}>Cargando...</p>

  if (salas.length === 0)
    return (
      <div className={cn('flex flex-col items-center gap-4 p-10')}>
        <p className={cn('text-muted-foreground')}>No tenés ninguna sala creada todavía.</p>
        <button
          onClick={onCrear}
          className="flex items-center gap-2 font-semibold text-white text-sm px-4 py-3 rounded-full bg-ld-azul hover:bg-ld-azul/80 transition-colors md:text-base"
        >
          <CirclePlus className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
          Crear una sala
        </button>
      </div>
    )

  return (
    <div className={cn('p-10 flex flex-col gap-3')}>
      <p className={cn('text-2xl')}>Tus salas:</p>
      <ul className={cn('flex flex-col gap-2')}>
        {salas.map((sala) => (
          <FilaSala key={sala.id} sala={sala} onRenombrar={renombrarSala} onEliminar={eliminarSala} />
        ))}
      </ul>
      <button
        onClick={onCrear}
        className="w-max self-center flex items-center gap-2 font-semibold text-white text-sm px-4 py-3 rounded-full bg-ld-azul hover:bg-ld-azul/80 transition-colors md:text-base"
      >
        <CirclePlus className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
        Crear sala
      </button>
    </div>
  )
}

export default function SalasPageClient() {
  const [activo, setActivo] = useState<'crear' | 'ver' | 'cuenta'>('ver')
  const [saberMasAbierto, setSaberMasAbierto] = useState(false)
  const { estado, listarSalas } = useConexionProfe()

  useEffect(() => {
    if (estado === StatusDeConexion.Conectado) listarSalas()
  }, [estado, listarSalas])

  // Toggle en localStorage para ver el dialog de ¿Qué es una sala? automáticamente en la primera visita
  useEffect(() => {
    if (!localStorage.getItem('salas-saber-mas-visto')) {
      setSaberMasAbierto(true)
      localStorage.setItem('salas-saber-mas-visto', '1')
    }
  }, [])

  return (
    <SidebarProvider className="flex-none sm:flex-1 flex-col sm:flex-row rounded-xl -mt-4 " style={{ minHeight: 0 }}>
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
              <p className="mt-2 max-w-md text-indigo-200 text-sm">
                Compartí el link o el QR que se encuentra dentro de la sala para que tus participantes se conecten e
                interactúen en vivo.{' '}
                <Dialog open={saberMasAbierto} onOpenChange={setSaberMasAbierto}>
                  <DialogTrigger asChild>
                    <button className="underline underline-offset-2 hover:text-white transition-colors">
                      Más información
                    </button>
                  </DialogTrigger>
                  <DialogContent
                    aria-description="Qué es una sala y qué podés hacer en ella"
                    className="max-w-xl max-h-[85vh] overflow-y-auto"
                  >
                    <DialogHeader>
                      <DialogTitle className='text-ld-violeta-oscuro text-2xl'>¿Qué es una sala?</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 text-sm text-foreground">
                      <p>
                        Una sala agrupa a tus participantes –generalmente estudiantes– bajo un mismo link o QR, con el
                        nivel de acceso que vos elijas: nombre libre, DNI, o una lista de invitadxs. Adentro podés encontrar estas
                        herramientas:
                      </p>
                      <p>
                        <span className="flex gap-2 items-center font-bold text-xl"><Icon className='w-6 h-6' icon="fluent:chat-bubbles-question-16-regular"/>Encuestas en vivo.</span> Lanzá preguntas y ejercicios para tu
                        clase, mirá los resultados actualizarse en tiempo real, y compartilos en pantalla con un
                        visualizador que se puede embeber en OBS.
                      </p>
                      <p>
                        <span className="flex gap-2 items-center font-bold text-xl"><Icon className='w-6 h-6 -rotate-3' icon="bi:grid-3x3"/>Go.</span> Tus estudiantes pueden jugar entre ellxs, jugar con vos,
                        y observar las partidas de otrxs mientras están en curso.
                      </p>
                      <p>
                        <span className="flex gap-2 items-center font-bold text-xl"><Icon className='w-6 h-6 ' icon="bi:people"/>Participantes.</span> Mirá quién se conectó y cuándo, y exportá ese
                        registro a Excel.
                      </p>
                      <p>
                        <span className="flex gap-2 items-center font-bold text-xl"><Icon className='w-6 h-6' icon="mage:box-question-mark"/>Colecciones.</span> Tus preguntas (y pronto tus partidas de Go) se
                        exportan e importan en YAML –un formato simple, editable a mano o con ayuda de una IA– y también
                        se guardan directo en tu Google Drive.
                      </p>
                      <p className='font-bold text-ld-violeta-oscuro my-4 text-center'>
                        ¡Creá tu sala y explorá cada uno de sus recursos!
                      </p>
                    </div>
                    <DialogFooter className="gap-2">
                     
                      <Button
                        className="bg-ld-violeta"
                        onClick={() => {
                          setActivo('crear')
                          setSaberMasAbierto(false)
                        }}
                      >
                        Crear sala
                      </Button>
                       <DialogClose asChild>
                        <Button variant="outline">Cerrar</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </p>
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
        {activo === 'ver' && <VerSalas onCrear={() => setActivo('crear')} />}
        {activo === 'cuenta' && <Cuenta />}
        <div className={activo !== 'crear' ? 'hidden' : ''}>
          <FormCrearSala />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
