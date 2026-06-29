'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
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
import { Header } from '@/components/salas/header-sala'
import { cn, nombreSplit } from '@/lib/utils'
import { SwitchCard } from '@/components/ui/switch-card'
import { MetodosLogin } from '@/wss/validators/auth'
import Link from 'next/link'
import { crearSala } from '@/server/crear-sala'
// LÍMITE SUSCRIPCIÓN (desactivado): re-agregar `obtenerLimiteSalas` al import para reactivar el gating.
import { eliminarSala, listarSalas, renombrarSala, type SalaResumen } from '@/server/listar-salas'
import { ListaInvitadosForm, ListaPermitidosForm } from '@/components/salas/encuestas-profe/lista-invitados-form'
import { SignOut } from '@/app/(herramientas)/login/components/botones'

// Crear sala desde salas general
type FormState = {
  nombre: string
  metodoLogin: MetodosLogin
  listaActiva: boolean
  soloInvitados: boolean
  lista: string[]
  nombres: Record<string, string>
}

function FormCrearSala() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    nombre: '',
    metodoLogin: MetodosLogin.Nombre,
    listaActiva: false,
    soloInvitados: false,
    lista: [],
    nombres: {},
  })
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pideDni = form.metodoLogin === MetodosLogin.DNI

  const handleCrear = async () => {
    setCreando(true)
    setError(null)
    try {
      const id = await crearSala(
        { metodo_login: form.metodoLogin, solo_invitados: form.soloInvitados },
        form.lista,
        form.nombre.trim() || undefined
      )
      // Al crear, entramos directo a operar la sala nueva.
      router.push(`/salas/${id}`)
    } catch (e) {
      console.error(e)
      setError('No se pudo crear la sala.')
      setCreando(false)
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
    <div className={cn('flex flex-col justify-center gap-2 my-4 w-full px-20')}>
      <h2 className={cn('text-xl font-bold text-center leading-6 my-6')}>Configuración de la sala</h2>

      <input
        type="text"
        value={form.nombre}
        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
        placeholder="Nombre de la sala (opcional)"
        className={cn('border rounded-lg px-3 py-2 w-full')}
      />

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

                  <div className={cn('flex border rounded flex-col items-center gap-2 max-h-72 mt-2')}>
                    <h1 className={cn('font-bold my-2')}>Lista de Invitadxs</h1>
                    <div className={cn('flex w-full')}>
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

      {error && <p className={cn('text-center text-red-600 text-sm mt-2')}>{error}</p>}

      <button
        className={cn(
          'mt-4 px-6 py-2 text-white text-xl border-2 bg-teal-500 rounded-full self-center transition-opacity',
          creando && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleCrear}
        disabled={creando}
      >
        {creando ? 'Creando...' : 'Crear'}
      </button>
    </div>
  )
}

// LÍMITE SUSCRIPCIÓN (desactivado): mensaje de upsell cuando se alcanzó el límite del plan.
// function LimiteAlcanzado() {
//   return (
//     <div className={cn('p-10 flex flex-col gap-2 items-center text-center')}>
//       <p className={cn('text-2xl font-bold')}>Llegaste al límite de tu plan</p>
//       <p className={cn('text-muted-foreground max-w-md')}>
//         Tu plan actual permite una sola sala. Para crear más, vas a poder suscribirte (próximamente).
//       </p>
//     </div>
//   )
// }

// Lista de salas del profe, con acciones de operar, renombrar y eliminar.
function VerSalas({
  salas,
  onRefrescar,
}: {
  salas: SalaResumen[] | undefined
  onRefrescar: () => void
}) {
  const handleRenombrar = async (sala: SalaResumen) => {
    const nuevo = window.prompt('Nuevo nombre de la sala:', sala.nombre ?? '')
    if (nuevo === null) return
    await renombrarSala(sala.id, nuevo)
    onRefrescar()
  }

  const handleEliminar = async (sala: SalaResumen) => {
    if (!window.confirm(`¿Eliminar la sala "${sala.nombre ?? sala.id}"? Esta acción no se puede deshacer.`)) return
    await eliminarSala(sala.id)
    onRefrescar()
  }

  if (salas === undefined) return <p className={cn('p-4 text-muted-foreground')}>Cargando...</p>

  if (salas.length === 0)
    return <p className={cn('p-4 text-muted-foreground')}>No tenés ninguna sala creada todavía.</p>

  return (
    <div className={cn('p-10 flex flex-col gap-3')}>
      <p className={cn('text-2xl')}>Tus salas:</p>
      <ul className={cn('flex flex-col gap-2')}>
        {salas.map((sala) => (
          <li
            key={sala.id}
            className={cn('flex items-center justify-between gap-2 px-4 py-3 border rounded-xl bg-white/60')}
          >
            <span className={cn('font-medium')}>{sala.nombre || `Sala ${sala.id}`}</span>
            <div className={cn('flex items-center gap-2')}>
              <Link
                href={`/salas/${sala.id}`}
                className={cn('px-3 py-1 border rounded-full hover:bg-slate-50 transition-colors')}
              >
                Ingresar
              </Link>
              <button
                onClick={() => handleRenombrar(sala)}
                className={cn('px-3 py-1 border rounded-full hover:bg-slate-50 transition-colors')}
              >
                Renombrar
              </button>
              <button
                onClick={() => handleEliminar(sala)}
                className={cn('px-3 py-1 border border-red-300 text-red-600 rounded-full hover:bg-red-50 transition-colors')}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Pagina principal
export default function SalasPage() {
  const [activo, setActivo] = useState<'crear' | 'ver'>('ver')
  const [salas, setSalas] = useState<SalaResumen[] | undefined>(undefined)
  // LÍMITE SUSCRIPCIÓN (desactivado): const [limite, setLimite] = useState<number>(1)
  const { data: session } = useSession()

  const cargar = useCallback(async () => {
    // LÍMITE SUSCRIPCIÓN (desactivado): cargar también `obtenerLimiteSalas()` y `setLimite(max)`.
    setSalas(await listarSalas())
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // LÍMITE SUSCRIPCIÓN (desactivado): const alLimite = salas !== undefined && salas.length >= limite

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-r from-cyan-500/70 to-indigo-500/70">
      <Header btnLogout={<SignOut />}>
        <p className="text-md md:text-4xl text-center">¡Hola {nombreSplit(session?.user?.name)}!</p>
      </Header>
      <SidebarProvider className="flex-1 px-20 py-10 rounded-xl" style={{ minHeight: 0 }}>
        <Sidebar className="rounded-l p-4 bg-indigo-500 text-white" collapsible="none">
          <SidebarHeader />
          <SidebarContent>
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
                  Agregar sala
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter />
        </Sidebar>

        <SidebarInset className="rounded-r">
          {activo === 'ver' && <VerSalas salas={salas} onRefrescar={cargar} />}
          <div className={activo !== 'crear' ? 'hidden' : ''}>
            {/* LÍMITE SUSCRIPCIÓN (desactivado): {alLimite ? <LimiteAlcanzado /> : <FormCrearSala />} */}
            <FormCrearSala />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
