'use client'

import { cn } from '@/lib/utils'
import { useConexionEstudiante } from '@/wss-cli/providers/wss-estudiante-context'
import { storeGo } from '@/wss-cli/stores/go-store'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Partida, TAMAÑOS_TABLERO, TamañoTablero } from '@/wss/validators/go'
import { BLANCO, calcularPuntaje, NEGRO, RELLENO, TableroGo } from './tablero-go'

export default function GoEstudiante({ userId }: { userId: string }) {
  const { inicializado, partida, desafios, rivales, observando } = storeGo()
  const { pedirRivales, desafiar, aceptar, rechazar, observar, dejarDeObservar } = useConexionEstudiante()

  useEffect(() => {
    if (inicializado && !partida && !observando) pedirRivales()
  }, [inicializado, partida, observando, pedirRivales])

  // Hasta que no sabemos si ya hay una partida en curso, no podemos decidir qué pantalla mostrar
  // (mostrar el buscador de rivales de entrada parpadea si después resulta que sí había una).
  if (!inicializado) return <p className="text-slate-500 text-sm">Cargando…</p>

  if (desafios.length > 0) return <DesafiosEntrantes desafios={desafios} aceptar={aceptar} rechazar={rechazar} />

  if (observando)
    return (
      <PartidaObservada
        partida={observando}
        onDejarDeObservar={() => dejarDeObservar(observando.id).catch((e) => toast.error(e.message))}
      />
    )

  if (!partida)
    return <BuscarRival rivales={rivales} onRefrescar={pedirRivales} onDesafiar={desafiar} onObservar={observar} />

  if (partida.estado === 'pendiente') return <EsperandoRival partida={partida} userId={userId} />

  return <PartidaEnCurso partida={partida} userId={userId} />
}

function DesafiosEntrantes({
  desafios,
  aceptar,
  rechazar,
}: {
  desafios: ReturnType<typeof storeGo.getState>['desafios']
  aceptar: (id: string) => Promise<unknown>
  rechazar: (id: string) => Promise<unknown>
}) {
  return (
    <div className="flex flex-col gap-4 items-center max-w-md mx-auto">
      <h2 className="text-xl font-bold">¡Te desafiaron a Go!</h2>
      {desafios.map((d) => (
        <div key={d.id} className="flex flex-col gap-2 items-center bg-white rounded-xl p-4 w-full border">
          <p>
            <span className="font-semibold">{d.negro.nombre}</span> te desafió a un tablero de {d.tamaño}x{d.tamaño}
          </p>
          <div className="flex gap-2">
            <button
              className="bg-emerald-500 text-white px-4 py-2 rounded"
              onClick={() => aceptar(d.id).catch((e) => toast.error(e.message))}
            >
              Aceptar
            </button>
            <button
              className="bg-slate-200 px-4 py-2 rounded"
              onClick={() => rechazar(d.id).catch((e) => toast.error(e.message))}
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function BuscarRival({
  rivales,
  onRefrescar,
  onDesafiar,
  onObservar,
}: {
  rivales: Array<{ userId: string; nombre: string; enPartida: boolean; partidaId: string | null }>
  onRefrescar: () => void
  onDesafiar: (rivalId: string, tamaño: TamañoTablero) => Promise<unknown>
  onObservar: (partidaId: string) => Promise<unknown>
}) {
  const [tamaño, setTamaño] = useState<TamañoTablero>(9)

  return (
    <div className="flex flex-col gap-4 items-center max-w-md mx-auto">
      <h2 className="text-xl font-bold">Elegí un rival</h2>

      <div className="flex gap-2 text-sm">
        {TAMAÑOS_TABLERO.map((t) => (
          <button
            key={t}
            className={cn(
              'px-3 py-1 rounded-full border',
              tamaño === t && 'bg-indigo-500 text-white border-indigo-500'
            )}
            onClick={() => setTamaño(t)}
          >
            {t}x{t}
          </button>
        ))}
      </div>

      {rivales.length === 0 && (
        <p className="text-slate-500 text-sm text-center">
          No hay compañeros conectados todavía.
          <br />
          <button className="underline mt-2" onClick={onRefrescar}>
            Refrescar
          </button>
        </p>
      )}

      <ul className="flex flex-col gap-2 w-full">
        {rivales.map((r) => (
          <li key={r.userId} className="flex items-center justify-between bg-white rounded-xl p-3 border">
            <span>{r.nombre}</span>
            {r.enPartida ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-slate-400">En una partida</span>
                {r.partidaId && (
                  <button
                    className="bg-slate-200 px-3 py-1 rounded text-xs"
                    onClick={() => onObservar(r.partidaId!).catch((e) => toast.error(e.message))}
                  >
                    Observar
                  </button>
                )}
              </div>
            ) : (
              <button
                className="bg-indigo-500 text-white px-3 py-1.5 rounded text-sm"
                onClick={() => onDesafiar(r.userId, tamaño).catch((e) => toast.error(e.message))}
              >
                Desafiar
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EsperandoRival({
  partida,
  userId,
}: {
  partida: NonNullable<ReturnType<typeof storeGo.getState>['partida']>
  userId: string
}) {
  const { abandonar } = useConexionEstudiante()
  const soyNegro = partida.negro.userId === userId
  const rival = soyNegro ? partida.blanco : partida.negro

  return (
    <div className="flex flex-col gap-4 items-center">
      <p className="text-lg">Esperando a que {rival.nombre} acepte el desafío...</p>
      <button
        className="text-sm underline text-slate-500"
        onClick={() => abandonar(partida.id).catch((e) => toast.error(e.message))}
      >
        Cancelar
      </button>
    </div>
  )
}

/** Partida ajena, en modo solo lectura (sin acciones), para un estudiante que la está observando. */
function PartidaObservada({ partida, onDejarDeObservar }: { partida: Partida; onDejarDeObservar: () => void }) {
  if (partida.estado === 'pendiente') {
    return (
      <div className="flex flex-col gap-4 items-center">
        <p className="text-lg">
          Esperando a que {partida.blanco.nombre} acepte el desafío de {partida.negro.nombre}...
        </p>
        <button className="text-sm underline text-slate-500" onClick={onDejarDeObservar}>
          Dejar de observar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 items-center w-full px-2">
      <div className="flex items-center gap-4 text-sm">
        <span style={{ color: RELLENO[NEGRO] }}>● {partida.negro.nombre}</span>
        <span style={{ color: RELLENO[BLANCO] }}>● {partida.blanco.nombre}</span>
      </div>

      {partida.estado === 'terminada' && <BannerResultado partida={partida} />}

      {partida.estado === 'jugando' && (
        <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: RELLENO[partida.turno] }}>
          <span
            className="inline-block h-3 w-3 rounded-full border border-slate-400"
            style={{ backgroundColor: RELLENO[partida.turno] }}
          />
          Juega {partida.turno === NEGRO ? partida.negro.nombre : partida.blanco.nombre}
        </p>
      )}

      {partida.estado === 'contando' && <p className="text-sm text-slate-600">Contando piedras muertas…</p>}

      <div className="flex flex-col items-center gap-3">
        <PanelCapturas capturador={BLANCO} capturas={partida.capturasBlancas} />

        <TableroGo
          tablero={partida.tablero}
          tamaño={partida.tamaño}
          removidas={partida.removidas}
          vivo={partida.vivo}
          modoConteo={partida.estado === 'contando'}
          turno={partida.estado === 'jugando' ? partida.turno : undefined}
          deshabilitado
        />

        <PanelCapturas capturador={NEGRO} capturas={partida.capturasNegras} />
      </div>

      <button className="text-sm underline text-slate-500" onClick={onDejarDeObservar}>
        {partida.estado === 'terminada' ? 'Volver a la sala' : 'Dejar de observar'}
      </button>
    </div>
  )
}

/** Encabezado de resultado ("Ganó X" / "Empate") una vez que la partida terminó. */
function BannerResultado({
  partida,
}: {
  partida: Pick<Partida, 'ganadorUserId' | 'negro' | 'blanco' | 'resultado' | 'motivoFin'>
}) {
  const colorGanador =
    partida.ganadorUserId === null ? null : partida.ganadorUserId === partida.negro.userId ? NEGRO : BLANCO

  return (
    <div className="flex flex-col gap-1 items-center text-center">
      <h2
        className="text-xl sm:text-2xl font-bold"
        style={colorGanador !== null ? { color: RELLENO[colorGanador] } : undefined}
      >
        {colorGanador === null ? 'Empate' : `Ganó ${colorGanador === NEGRO ? 'Negro' : 'Blanco'}`}
      </h2>
      {partida.resultado && (
        <p className="text-slate-600 text-sm">
          Negro {partida.resultado.negro} — Blanco {partida.resultado.blanco}
        </p>
      )}
      {partida.motivoFin === 'abandono' && <p className="text-slate-500 text-xs">Terminó por abandono</p>}
    </div>
  )
}

/** Piedras capturadas por `capturador`, mostradas como circulitos del color capturado (el opuesto). */
function PanelCapturas({ capturador, capturas }: { capturador: 1 | 2; capturas: number }) {
  if (capturas === 0) return null

  const colorCapturado = capturador === NEGRO ? BLANCO : NEGRO
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: RELLENO[capturador] }}>
        Capturas de {capturador === NEGRO ? 'negro' : 'blanco'}
      </span>
      <div className="flex flex-wrap gap-1 justify-center max-w-[220px]">
        {Array.from({ length: capturas }, (_, i) => (
          <span
            key={i}
            className="inline-block h-3.5 w-3.5 rounded-full border border-slate-400"
            style={{ backgroundColor: RELLENO[colorCapturado] }}
          />
        ))}
      </div>
    </div>
  )
}

function PartidaEnCurso({
  partida,
  userId,
}: {
  partida: NonNullable<ReturnType<typeof storeGo.getState>['partida']>
  userId: string
}) {
  const { jugar, pasar, marcarMuerta, confirmarConteo, abandonar } = useConexionEstudiante()

  const soyNegro = partida.negro.userId === userId
  const miColor = soyNegro ? NEGRO : BLANCO
  const colorRival = soyNegro ? BLANCO : NEGRO
  const rival = soyNegro ? partida.blanco : partida.negro
  const esMiTurno = partida.turno === miColor
  const capturasDe = (color: 1 | 2) => (color === NEGRO ? partida.capturasNegras : partida.capturasBlancas)

  // Previsualización en vivo: cómo quedaría el puntaje (con komi) si se confirma el conteo tal como
  // está marcado ahora mismo. Usa la misma función que el resultado final del servidor, así que
  // nunca puede mostrar un número distinto al que se confirma al terminar la partida.
  const conteoEnVivo = useMemo(
    () =>
      partida.estado === 'contando'
        ? calcularPuntaje(
            partida.tablero,
            partida.tamaño,
            partida.removidas,
            partida.capturasNegras,
            partida.capturasBlancas
          )
        : null,
    [
      partida.estado,
      partida.tablero,
      partida.removidas,
      partida.tamaño,
      partida.capturasNegras,
      partida.capturasBlancas,
    ]
  )

  return (
    <div className="flex flex-col gap-4 items-center w-full px-2">
      <div className="flex items-center gap-4 text-sm">
        <span>
          Vos: <b>{soyNegro ? 'Negro' : 'Blanco'}</b>
        </span>
        <span>Rival: {rival.nombre}</span>
      </div>

      {partida.estado === 'terminada' && <BannerResultado partida={partida} />}

      {partida.estado === 'jugando' && (
        <p
          className={cn('flex items-center gap-2 text-sm font-semibold', esMiTurno && 'animate-pulse')}
          style={{
            color: RELLENO[partida.turno],
          }}
        >
          <span
            className="inline-block h-3 w-3 rounded-full border border-slate-400"
            style={{ backgroundColor: RELLENO[partida.turno] }}
          />
          Juega {partida.turno === NEGRO ? 'negro' : 'blanco'} — {esMiTurno ? 'tu turno' : rival.nombre}
        </p>
      )}

      {partida.estado === 'contando' && conteoEnVivo && (
        <div className="text-sm text-slate-600 text-center">
          <p>Marcá las piedras muertas y confirmá.</p>
          <p className="font-semibold mt-1">
            Conteo en vivo — Negro {conteoEnVivo.negro} · Blanco {conteoEnVivo.blanco}
          </p>
          <p>Confirmaron: {Number(partida.confirmaron.negro) + Number(partida.confirmaron.blanco)}/2</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <PanelCapturas capturador={colorRival} capturas={capturasDe(colorRival)} />

        <TableroGo
          tablero={partida.tablero}
          tamaño={partida.tamaño}
          removidas={partida.removidas}
          vivo={partida.vivo}
          modoConteo={partida.estado === 'contando'}
          miColor={partida.estado === 'jugando' && esMiTurno ? miColor : undefined}
          turno={partida.estado === 'jugando' ? partida.turno : undefined}
          esMiTurno={partida.estado === 'jugando' && esMiTurno}
          deshabilitado={partida.estado === 'jugando' ? !esMiTurno : partida.estado === 'terminada'}
          onJugar={(x, y) => {
            if (partida.estado === 'jugando') jugar(partida.id, x, y).catch((e) => toast.error(e.message))
            else if (partida.estado === 'contando') marcarMuerta(partida.id, x, y).catch((e) => toast.error(e.message))
          }}
        />

        <PanelCapturas capturador={miColor} capturas={capturasDe(miColor)} />
      </div>

      <div className="flex gap-3">
        {partida.estado === 'jugando' && (
          <button
            className="bg-slate-200 px-4 py-2 rounded disabled:opacity-40"
            disabled={!esMiTurno}
            onClick={() => pasar(partida.id).catch((e) => toast.error(e.message))}
          >
            Pasar
          </button>
        )}
        {partida.estado === 'contando' && !(soyNegro ? partida.confirmaron.negro : partida.confirmaron.blanco) && (
          <button
            className="bg-indigo-500 text-white px-4 py-2 rounded"
            onClick={() => confirmarConteo(partida.id).catch((e) => toast.error(e.message))}
          >
            Confirmar conteo
          </button>
        )}
        {partida.estado === 'terminada' ? (
          <button className="bg-indigo-500 text-white px-4 py-2 rounded" onClick={() => storeGo.getState().reset()}>
            Volver a la sala
          </button>
        ) : (
          <button
            className="text-sm underline text-slate-500"
            onClick={() => abandonar(partida.id).catch((e) => toast.error(e.message))}
          >
            Abandonar
          </button>
        )}
      </div>
    </div>
  )
}
