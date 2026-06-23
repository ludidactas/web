'use client'

import { useEffect, useState } from 'react'
import { useSession} from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider} from '@/components/ui/sidebar'
import { Header } from '@/components/salas/header-sala'
import { cn, nombreSplit } from '@/lib/utils'
import { SwitchCard } from '@/components/ui/switch-card'
import { MetodosLogin } from '@/wss/validators/auth'
import Link from 'next/link'
import { crearSala } from '@/server/crear-sala'
import { obtenerIdSala } from '@/server/obtener-sala'
import { ListaInvitadosForm, ListaPermitidosForm } from '@/components/salas/encuestas-profe/lista-invitados-form'
import { SignOut } from '@/app/(herramientas)/login/components/botones'

// Crear sala desde salas general
type FormState = {
  metodoLogin: MetodosLogin
  listaActiva: boolean
  soloInvitados: boolean
  lista: string[]
  nombres: Record<string, string>
}

function FormCrearSala() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    metodoLogin: MetodosLogin.Nombre,
    listaActiva: false,
    soloInvitados: false,
    lista: [],
    nombres: {},
  })
  const [creando, setCreando] = useState(false)

  const pideDni = form.metodoLogin === MetodosLogin.DNI

  const handleCrear = async () => {
    setCreando(true)
    try {
      const id = await crearSala({ metodo_login: form.metodoLogin, solo_invitados: form.soloInvitados }, form.lista)
      router.push(`/salas/${id}`)
    } catch (e) {
      console.error(e)
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

// Ver salas (aun no esta configurado que un profe pueda ver/crear varias salas?)
function VerSalas() {
  const [idSala, setIdSala] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    obtenerIdSala().then(setIdSala)
  }, [])

  if (idSala === undefined) return <p className={cn('p-4 text-muted-foreground')}>Cargando...</p>

  if (idSala === null)
    return <p className={cn('p-4 text-muted-foreground')}>No tenés ninguna sala creada todavía.</p>

  return (
    <div className={cn('p-10 flex flex-col gap-2')}>
      <p className={cn('text-2xl')}>Tus salas activas:</p>
      <Link
        href={`/salas/${idSala}`}
        className={cn('px-4 py-2 border rounded-full text-center hover:bg-slate-50 transition-colors w-fit')}
      >
        Ir a la sala {idSala}
      </Link>
    </div>
  )
}

// Pagina principal
export default function SalasPage() {
  const [activo, setActivo] = useState<'crear' | 'ver'>('crear')
  const { data: session } = useSession()

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-r from-cyan-500/70 to-indigo-500/70">
      <Header btnLogout={<SignOut />}>
        <p className="text-md md:text-4xl text-center">¡Hola {nombreSplit(session?.user?.name)}!</p>
      </Header>
      <SidebarProvider className="flex-1 px-20 py-10 rounded-xl" style={{ minHeight: 0 }}>
        <Sidebar className='rounded-l p-4' collapsible="none">
          <SidebarHeader />
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activo === 'ver'} onClick={() => setActivo('ver')}>
                  Ver Salas
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activo === 'crear'} onClick={() => setActivo('crear')}>
                  Crear sala
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter />
        </Sidebar>

        <SidebarInset className='rounded-r'>
          <div className={activo !== 'crear' ? 'hidden' : ''}><FormCrearSala /></div>
          {activo === 'ver' && <VerSalas />}
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
