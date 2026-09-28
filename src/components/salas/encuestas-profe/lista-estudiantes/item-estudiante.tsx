import { PropsWithChildren, useState } from 'react'
import { isEmpty } from 'remeda'
import { toast } from 'sonner'
import { Icon } from '@iconify/react/dist/iconify.js'

import getInitials, { getRandomColor } from '@/lib/avatarname'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeEncuestasProfe } from '@/wss-cli/stores/encuestas-store'
import { storeEstudiantes, type Estudiante } from '@/wss-cli/stores/estudiantes-store'
import { storeGo } from '@/wss-cli/stores/go-store'
import { storePermitidos } from '@/wss-cli/stores/permitidos-store'

/** Una fila de la lista de participantes: avatar, nombre/DNI/email, y las acciones del profe sobre
 * ese estudiante (invitar a Go, ver su partida o sus votos). */
export function ItemEstudiante({ estudiante: e, modo }: { estudiante: Estudiante; modo: 'encuestas' | 'go' }) {
  const { invitar } = useConexionProfe()
  const { contrincantes, partida: partidaPropia } = storeGo()
  const { nombres: nombresInvitados } = storePermitidos()

  return (
    <li
      className={cn('flex items-center gap-2', {
        'text-black ': e.conectado,
        'text-slate-400 grayscale': !e.conectado,
      })}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 shrink-0 mt-1 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-center bg-cover"
        style={{
          backgroundImage: e.avatar ? `url(${e.avatar})` : undefined,
          backgroundColor: getRandomColor(e.nombre || 'Anonimo'),
        }}
      >
        {!e.avatar && getInitials(e.nombre || 'Anonimo')}
      </div>
      {/* Nombre, email y DNI */}
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5">
          {e.nombre}
          {nombresInvitados[e.userId] && (
            <span className="text-xs text-slate-400">– {nombresInvitados[e.userId]}</span>
          )}
        </span>
        {e.dni && <span className="text-teal-500">{e.dni}</span>}
        {!e.dni && e.email && <span className="text-teal-500">{e.email}</span>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {modo === 'go' && e.conectado && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="cursor-pointer text-teal-500 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-teal-500"
                disabled={!!partidaPropia || !!contrincantes.find((c) => c.userId === e.userId)?.enPartida}
                onClick={() =>
                  invitar(e.userId).catch((err) =>
                    toast.error(err instanceof Error ? err.message : 'No se pudo invitar')
                  )
                }
              >
                <Icon icon="lucide:play" width={18} height={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Invitar a {e.nombre} a jugar Go</p>
            </TooltipContent>
          </Tooltip>
        )}

        {modo === 'go' ? (
          <TooltipPartidaEstudiante userId={e.userId} conectado={e.conectado}>
            <Icon icon="lucide:list-collapse" className="cursor-pointer text-gray-500 hover:text-cyan-500" />
          </TooltipPartidaEstudiante>
        ) : (
          <TooltipVotosEstudiante userId={e.userId}>
            <Icon icon="lucide:list-collapse" className="cursor-pointer text-gray-500 hover:text-cyan-500" />
          </TooltipVotosEstudiante>
        )}
      </div>
    </li>
  )
}

/** Con quién está jugando (o no) cada estudiante en Go, en vez de sus votos de encuestas. La info sale
 * de `contrincantes` (la misma que alimenta "Elegí un contrincante"), que solo cubre a los conectados. */
function TooltipPartidaEstudiante({
  children,
  userId,
  conectado,
}: PropsWithChildren & { userId: string; conectado: boolean }) {
  const { contrincantes } = storeGo()
  const info = contrincantes.find((c) => c.userId === userId)

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {!conectado && 'Estudiante desconectado'}
          {conectado && !info?.enPartida && 'No está jugando ninguna partida'}
          {conectado && info?.enPartida && `Jugando contra ${info.contrincante?.nombre ?? '…'}`}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

function TooltipVotosEstudiante({ children, userId }: PropsWithChildren & { userId: string }) {
  const [open, setOpen] = useState(false)

  const { pedirVotosEstudiante } = useConexionProfe()
  const { items: estudiantes } = storeEstudiantes()
  const { items: encuestas } = storeEncuestasProfe()

  const estudiante = estudiantes.find((e) => e.userId === userId)

  if (!estudiante) return children

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger onClick={() => setOpen(true)} onMouseEnter={() => pedirVotosEstudiante(userId)} asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent asChild>
        <div className="text-sm rounded-md flex flex-col gap-2 max-h-[40vh] max-w-md overflow-y-auto pl-2 pr-4">
          {!estudiante.votos && 'Cargando...'}
          {estudiante.votos && isEmpty(estudiante.votos) && 'No votó todavía'}
          {estudiante.votos &&
            Object.entries(estudiante.votos).map(([idEncuesta, idsOpciones]) => {
              // Buscamos la encuesta por id en el storage para renderizar el nombre
              const encuesta = encuestas.find((e) => e.id === idEncuesta)

              if (!encuesta)
                return (
                  <div key={idEncuesta} className="text-gray-500">
                    Encuesta {idEncuesta} no encontrada
                  </div>
                )

              const textoPregunta =
                encuesta.pregunta.length > 120 ? encuesta.pregunta.slice(0, 120) + '...' : encuesta.pregunta

              return (
                <div key={idEncuesta} className="hover:bg-[#d9f3f8] py-1 px-2 rounded">
                  <strong>{textoPregunta}</strong>
                  <div>
                    {idsOpciones.map((idOpcion, i) => {
                      // Buscamos la opción por id en la encuesta para renderizar el texto
                      const opcion = encuesta.opciones.find((o) => o.id === idOpcion)

                      if (!opcion)
                        return (
                          <p key={i} className="text-gray-500">
                            Opción {idOpcion} no encontrada
                          </p>
                        )

                      const textoOpcion = opcion.texto.length > 120 ? opcion.texto.slice(0, 120) + '...' : opcion.texto

                      return (
                        <p key={i} className="pl-1 flex gap-0.5 items-center text-xs">
                          {encuesta.admiteMultiplesVotos && (
                            <Icon icon="lucide:square-check-big" className="w-3 h-3 shrink-0" />
                          )}
                          {!encuesta.admiteMultiplesVotos && (
                            <Icon icon="lucide:circle-check-big" className="w-3 h-3 shrink-0" />
                          )}
                          {textoOpcion}
                        </p>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
