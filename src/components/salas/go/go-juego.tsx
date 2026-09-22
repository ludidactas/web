'use client'

import { cn } from '@/lib/utils'
import { storeGo } from '@/wss-cli/stores/go-store'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Partida, TAMAÑOS_TABLERO, TamañoTablero } from '@/wss/validators/go'
import { BLANCO, calcularPuntaje, NEGRO, PiedraIcono, RELLENO, TableroGo } from './tablero-go'
import { Outlined } from '@/components/fx/filtros'
import { Boton } from '@/components/custom/ld-boton-svg'
import { Icon } from '@iconify/react/dist/iconify.js'

/** Comandos de Go de una conexión (estudiante o profe): ambas comparten exactamente esta forma, ver
 * `estudiante-go-handlers.ts` / `profe-go-handlers.ts` del lado cliente. */
export type AccionesGo = {
  pedirContrincantes: () => void
  invitar: (contrincanteId: string, tamaño?: TamañoTablero) => Promise<Partida>
  aceptar: (partidaId: string) => Promise<Partida>
  rechazar: (partidaId: string) => Promise<void>
  jugar: (partidaId: string, x: number, y: number) => Promise<Partida>
  pasar: (partidaId: string) => Promise<Partida>
  marcarMuerta: (partidaId: string, x: number, y: number) => Promise<Partida>
  confirmarConteo: (partidaId: string) => Promise<Partida>
  abandonar: (partidaId: string) => Promise<Partida>
  observar: (partidaId: string) => Promise<Partida>
  dejarDeObservar: (partidaId: string) => Promise<void>
}

/** Flujo completo de Go (invitaciones, buscador de contrincantes, partida en curso) para quien juega:
 * usado tanto por el estudiante como por el profe, cada uno con sus propios `acciones` de conexión. */
export default function GoJuego({ userId, acciones }: { userId: string; acciones: AccionesGo }) {
  const { inicializado, partida, invitaciones, contrincantes, observando } = storeGo()
  const { pedirContrincantes, invitar, aceptar, rechazar, observar, dejarDeObservar, abandonar } = acciones

  // Tengo una partida pendiente donde soy el invitado?
  const soyInvitado = partida?.estado === 'pendiente' && partida.blanco.userId === userId
  // Si me llega una invitación mientras `partida` todavía tiene la mía anterior ya terminada, no la
  // mostramos acá arriba de la tuya propia (eso lo hace elegir dejar de mirar su tablero, ver abajo):
  // solo la sumamos a la lista una vez que `partida` se soltó (`!partida`, ver más abajo).
  const invitacionesEntrantes =
    soyInvitado && !invitaciones.some((i) => i.id === partida!.id) ? [...invitaciones, partida!] : invitaciones

  // Mientras juego, puedo "pausar" para ver la lista de contrincantes sin abandonar mi partida (no
  // navega afuera de Go: la partida sigue jugándose en el server, y una tarjeta en esa lista me deja
  // volver a ella). Si deja de estar jugando/contando (terminó, o me quedé sin partida), se cancela
  // sola: no tiene sentido seguir "pausado" de algo que ya no está en curso.
  const [pausada, setPausada] = useState(false)
  const enPausa = pausada && (partida?.estado === 'jugando' || partida?.estado === 'contando')

  useEffect(() => {
    if (partida && partida.estado !== 'jugando' && partida.estado !== 'contando') setPausada(false)
  }, [partida])

  useEffect(() => {
    if (inicializado && (!partida || soyInvitado || enPausa) && !observando) pedirContrincantes()
  }, [inicializado, partida, soyInvitado, enPausa, observando, pedirContrincantes])

  // Hasta que no sabemos si ya hay una partida en curso, no podemos decidir qué pantalla mostrar
  // (mostrar el buscador de contrincantes de entrada parpadea si después resulta que sí había una).
  if (!inicializado)
    return (
      <p className="flex flex-col items-center gap-2 justify-center mt-20 text-slate-500 text-3xl">
        <Icon className="w-10 h-10" icon={'eos-icons:bubble-loading'} />
        Cargando…
      </p>
    )

  if (observando)
    return (
      <PartidaObservada
        partida={observando}
        onDejarDeObservar={() => dejarDeObservar(observando.id).catch((e) => toast.error(e.message))}
      />
    )

  // Sin partida propia, con una pendiente de responder, o pausando la propia: en los tres casos seguís
  // viendo la sala (lista de contrincantes) en vez de que otra vista tape toda la pantalla.
  if (!partida || soyInvitado || enPausa)
    return (
      <BuscarContrincante
        contrincantes={contrincantes}
        invitacionesEntrantes={invitacionesEntrantes}
        onRefrescar={pedirContrincantes}
        onInvitar={invitar}
        onObservar={observar}
        onAceptar={aceptar}
        onRechazar={rechazar}
        partidaEnPausa={enPausa ? partida : null}
        onVolverAPartida={() => setPausada(false)}
      />
    )

  if (partida.estado === 'pendiente')
    return <EsperandoContrincante partida={partida} userId={userId} rechazar={rechazar} />

  return <PartidaEnCurso partida={partida} userId={userId} acciones={acciones} onVolverASala={() => setPausada(true)} />
}

function InvitacionesEntrantes({
  invitaciones,
  aceptar,
  rechazar,
}: {
  invitaciones: ReturnType<typeof storeGo.getState>['invitaciones']
  aceptar: (id: string) => Promise<unknown>
  rechazar: (id: string) => Promise<unknown>
}) {
  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <h2 className="text-lg font-bold">¡Te invitaron a jugar Go!</h2>
      {invitaciones.map((i) => (
        <div key={i.id} className="flex flex-col gap-2 items-center bg-white rounded-xl p-4 w-full border">
          <p>
            <span className="font-semibold">{i.negro.nombre}</span> te invitó a un tablero de {i.tamaño}x{i.tamaño}
          </p>
          <div className="flex gap-2">
            <button
              className="bg-emerald-500 text-white px-4 py-2 rounded"
              onClick={() => aceptar(i.id).catch((e) => toast.error(e.message))}
            >
              Aceptar
            </button>
            <button
              className="bg-slate-200 px-4 py-2 rounded"
              onClick={() => rechazar(i.id).catch((e) => toast.error(e.message))}
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function BuscarContrincante({
  contrincantes,
  invitacionesEntrantes,
  onRefrescar,
  onInvitar,
  onObservar,
  onAceptar,
  onRechazar,
  partidaEnPausa,
  onVolverAPartida,
}: {
  contrincantes: ReturnType<typeof storeGo.getState>['contrincantes']
  invitacionesEntrantes: ReturnType<typeof storeGo.getState>['invitaciones']
  onRefrescar: () => void
  onInvitar: (contrincanteId: string, tamaño: TamañoTablero) => Promise<unknown>
  onObservar: (partidaId: string) => Promise<unknown>
  onAceptar: (partidaId: string) => Promise<unknown>
  onRechazar: (partidaId: string) => Promise<unknown>
  /** Mi propia partida, si estoy acá "pausándola" en vez de sin ninguna partida activa. */
  partidaEnPausa: Partida | null
  onVolverAPartida: () => void
}) {
  const [tamaño, setTamaño] = useState<TamañoTablero>(9)

  return (
    <div className="flex flex-col gap-6 items-center max-w-md mx-auto w-full">
      <div className="flex flex-col gap-4 items-center w-full">
        <h2 className="text-xl font-bold">Elegí un contrincante y un tamaño de tablero</h2>

        {partidaEnPausa && (
          <div className="flex items-center justify-between gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 w-full text-sm">
            <span>Tenés una partida en curso.</span>
            <button className="text-indigo-600 font-semibold underline shrink-0" onClick={onVolverAPartida}>
              Volver a mi partida
            </button>
          </div>
        )}

        <div className="flex gap-2 text-sm">
          {TAMAÑOS_TABLERO.map((t) => (
            <button key={t} onClick={() => setTamaño(t)}>
              <Boton
                color={tamaño === t ? '#6366f1' : '#ccb2ff'}
                shadowColor={tamaño === t ? '#4338ca' : '#6b34a4'}
                classNames={{ root: 'flex items-center justify-center w-16 h-9 hover:scale-105 transition-transform' }}
              >
                <span className={cn('text-xs font-bold', tamaño === t ? 'text-white' : 'text-black')}>
                  {t}x{t}
                </span>
              </Boton>
            </button>
          ))}
        </div>

        {contrincantes.length === 0 && (
          <p className="text-slate-500 text-sm text-center">
            No hay compañeros conectados todavía.
            <br />
            <button className="underline mt-2" onClick={onRefrescar}>
              Refrescar
            </button>
          </p>
        )}

        <ul className="flex flex-col gap-2 w-full">
          {contrincantes.map((c) => {
            const esMiContrincantePausado = c.partidaId != null && c.partidaId === partidaEnPausa?.id
            const invitacionDe = invitacionesEntrantes.find((i) => i.id === c.partidaId)
            return (
              <li key={c.userId} className="flex items-center justify-between bg-white rounded-xl p-3 border">
                <span>{c.nombre}</span>
                {c.enPartida ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-slate-400">
                      {invitacionDe
                        ? 'Te invitó a jugar'
                        : esMiContrincantePausado
                        ? 'Es tu contrincante'
                        : 'En una partida'}
                    </span>
                    {invitacionDe ? (
                      <div className="flex gap-1">
                        <button
                          className="bg-emerald-500 text-white px-3 py-1 rounded text-xs"
                          onClick={() => onAceptar(invitacionDe.id).catch((e) => toast.error(e.message))}
                        >
                          Aceptar
                        </button>
                        <button
                          className="bg-slate-200 px-3 py-1 rounded text-xs"
                          onClick={() => onRechazar(invitacionDe.id).catch((e) => toast.error(e.message))}
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : esMiContrincantePausado ? (
                      <button className="bg-indigo-500 text-white px-3 py-1 rounded text-xs" onClick={onVolverAPartida}>
                        Volver a la partida
                      </button>
                    ) : (
                      c.partidaId && (
                        <button
                          className="bg-slate-200 px-3 py-1 rounded text-xs"
                          onClick={() => onObservar(c.partidaId!).catch((e) => toast.error(e.message))}
                        >
                          Observar
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <button
                    className="bg-indigo-500 text-white px-3 py-1.5 rounded text-sm disabled:opacity-40"
                    disabled={!!partidaEnPausa}
                    title={partidaEnPausa ? 'Volvé a tu partida antes de invitar a alguien más' : undefined}
                    onClick={() => onInvitar(c.userId, tamaño).catch((e) => toast.error(e.message))}
                  >
                    Invitar
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {invitacionesEntrantes.length > 0 && (
        <InvitacionesEntrantes invitaciones={invitacionesEntrantes} aceptar={onAceptar} rechazar={onRechazar} />
      )}
    </div>
  )
}

function EsperandoContrincante({
  partida,
  userId,
  rechazar,
}: {
  partida: NonNullable<ReturnType<typeof storeGo.getState>['partida']>
  userId: string
  rechazar: AccionesGo['rechazar']
}) {
  const soyNegro = partida.negro.userId === userId
  const contrincante = soyNegro ? partida.blanco : partida.negro

  return (
    <div className="flex flex-col gap-4 items-center">
      <p className="text-lg">Esperando a que {contrincante.nombre} acepte la invitación...</p>
      <button
        className="text-sm underline text-slate-500"
        onClick={() => rechazar(partida.id).catch((e) => toast.error(e.message))}
      >
        Cancelar
      </button>
    </div>
  )
}

/** Partida ajena, en modo solo lectura (sin acciones), para quien la está observando. */
function PartidaObservada({ partida, onDejarDeObservar }: { partida: Partida; onDejarDeObservar: () => void }) {
  if (partida.estado === 'pendiente') {
    return (
      <div className="flex flex-col gap-4 items-center">
        <p className="text-lg">
          Esperando a que {partida.blanco.nombre} acepte la invitación de {partida.negro.nombre}...
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
        <span style={{ color: '#CCC' }}>● {partida.blanco.nombre}</span>
      </div>

      {partida.estado === 'terminada' && <BannerResultado partida={partida} />}

      {partida.estado === 'jugando' && (
        <p
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: partida.turno === NEGRO ? RELLENO[partida.turno] : '#CCC' }}
        >
          <span
            className="inline-block h-3 w-3 rounded-full border"
            style={{
              backgroundColor: partida.turno === NEGRO ? RELLENO[partida.turno] : '#CCC',
            }}
          />
          Juega {partida.turno === NEGRO ? partida.negro.nombre : partida.blanco.nombre}
        </p>
      )}

      {partida.estado === 'contando' && <p className="text-sm text-slate-600">Contando piedras muertas…</p>}

      <div className="flex flex-col items-center gap-3">
        <TableroGo
          tablero={partida.tablero}
          tamaño={partida.tamaño}
          removidas={partida.removidas}
          vivo={partida.vivo}
          modoConteo={partida.estado === 'contando'}
          turno={partida.estado === 'jugando' ? partida.turno : undefined}
          ultimaJugada={partida.ultimaJugada}
          deshabilitado
        />

        <PanelCapturas capturasNegras={partida.capturasNegras} capturasBlancas={partida.capturasBlancas} />
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

  const titulo = colorGanador === null ? 'Empate' : `Ganó ${colorGanador === NEGRO ? 'Negro' : 'Blanco'}`
  const h2 = (
    <h2
      className="text-xl sm:text-2xl font-bold"
      style={colorGanador !== null ? { color: RELLENO[colorGanador] } : undefined}
    >
      {titulo}
    </h2>
  )

  return (
    <div className="flex flex-col gap-1 items-center text-center">
      {colorGanador === BLANCO ? <Outlined outlineColor="negro">{h2}</Outlined> : h2}
      {partida.resultado && (
        <p className="text-slate-600 text-sm">
          Negro {partida.resultado.negro} — Blanco {partida.resultado.blanco}
        </p>
      )}
      {partida.motivoFin === 'abandono' && <p className="text-slate-500 text-xs">Terminó por abandono</p>}
    </div>
  )
}

/** Panel único de capturas debajo del tablero. `capturasNegras`/`capturasBlancas` cuentan, como en
 * `Partida`, las piedras que capturó cada jugador (no las que le capturaron a él), así que el ícono
 * de cada número es el del color CAPTURADO: negro captura blancas, blanco captura negras. */
function PanelCapturas({ capturasNegras, capturasBlancas }: { capturasNegras: number; capturasBlancas: number }) {
  if (capturasNegras === 0 && capturasBlancas === 0) return null

  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
      Capturas:
      <span className="inline-flex items-center gap-1">
        <PiedraIcono color={BLANCO} className="h-4 w-4" /> {capturasNegras}
      </span>
      <span className="inline-flex items-center gap-1">
        <PiedraIcono color={NEGRO} className="h-4 w-4" /> {capturasBlancas}
      </span>
    </div>
  )
}

function PartidaEnCurso({
  partida,
  userId,
  acciones,
  onVolverASala,
}: {
  partida: NonNullable<ReturnType<typeof storeGo.getState>['partida']>
  userId: string
  acciones: AccionesGo
  onVolverASala: () => void
}) {
  const { jugar, pasar, marcarMuerta, confirmarConteo, abandonar } = acciones

  const soyNegro = partida.negro.userId === userId
  const miColor = soyNegro ? NEGRO : BLANCO
  const contrincante = soyNegro ? partida.blanco : partida.negro
  const esMiTurno = partida.turno === miColor

  // Jugada elegida en el tablero pero todavía sin enviar al server: el click ya no juega directo,
  // solo marca la intersección candidata. Se confirma (o cancela) con los botones de abajo, así el
  // jugador puede "probar" dónde poner la ficha antes de comprometerse.
  const [jugadaPendiente, setJugadaPendiente] = useState<{ x: number; y: number } | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  // Si dejó de ser mi turno (jugada confirmada, o volví a la sala y perdí el estado), no tiene
  // sentido dejar una selección vieja colgada para la próxima vez que sea mi turno.
  useEffect(() => {
    if (!esMiTurno) setJugadaPendiente(null)
  }, [esMiTurno])

  function confirmarJugada() {
    if (!jugadaPendiente) return
    setConfirmando(true)
    jugar(partida.id, jugadaPendiente.x, jugadaPendiente.y)
      .then(() => setJugadaPendiente(null))
      .catch((e) => toast.error(e.message))
      .finally(() => setConfirmando(false))
  }

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
    <div className="flex flex-col gap-4 items-center p-2 rounded-2xl">
      <div className="flex flex-col items-center gap-2 text-md mb-2">
        <span className='font-bold border-2 shadow-sm p-3 text-xl rounded-full inline-flex items-center gap-1.5'>
          Tu color: 
          <PiedraIcono color={miColor} className="h-4 w-4" />{' '}
          <span className='font-bold '>{soyNegro ? 'Negro' : 'Blanco'}</span>
        </span>
        <span className='font-bold  p-2 rounded-xl'> 
          Contrincante: <span className="font-bold">{contrincante.nombre}</span>
        </span>
      </div>

      {partida.estado === 'terminada' && <BannerResultado partida={partida} />}

      {partida.estado === 'jugando' && (
        <p
          className={cn('flex items-center gap-1 text-md font-semibold', esMiTurno && 'animate-pulse')}
          style={{
            color: RELLENO[partida.turno],
          }}
        >
          {partida.turno === BLANCO ? (
            <Outlined radius={2} outlineColor="black" className="flex items-center gap-2 shadow-2xl tracking-wide">
              <PiedraIcono color={partida.turno} className="h-3 w-3" />
              {esMiTurno ? 'Tu turno' : 'Juega blanco '}
            </Outlined>
          ) : (
            <>
              <PiedraIcono color={partida.turno} className="h-3 w-3" />
               {esMiTurno ? 'Tu turno' : 'Juega negro'}
            </>
          )}
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
        <TableroGo
          tablero={partida.tablero}
          tamaño={partida.tamaño}
          removidas={partida.removidas}
          vivo={partida.vivo}
          modoConteo={partida.estado === 'contando'}
          miColor={partida.estado === 'jugando' && esMiTurno ? miColor : undefined}
          turno={partida.estado === 'jugando' ? partida.turno : undefined}
          esMiTurno={partida.estado === 'jugando' && esMiTurno}
          ultimaJugada={partida.ultimaJugada}
          pendiente={partida.estado === 'jugando' ? jugadaPendiente : null}
          deshabilitado={
            partida.estado === 'jugando' ? !esMiTurno || confirmando : partida.estado === 'terminada'
          }
          onJugar={(x, y) => {
            if (partida.estado === 'jugando') {
              // Clickear la misma intersección ya elegida la cancela; clickear otra reemplaza la selección.
              setJugadaPendiente((actual) => (actual && actual.x === x && actual.y === y ? null : { x, y }))
            } else if (partida.estado === 'contando') {
              marcarMuerta(partida.id, x, y).catch((e) => toast.error(e.message))
            }
          }}
        />

        {partida.estado === 'jugando' && (
          <button
            className="bg-emerald-500 text-white px-4 py-2 rounded-full disabled:opacity-40 hover:scale-105"
            disabled={!jugadaPendiente || confirmando}
            onClick={confirmarJugada}
          >
            Confirmar jugada
          </button>
        )}

        <PanelCapturas capturasNegras={partida.capturasNegras} capturasBlancas={partida.capturasBlancas} />
      </div>

      <div className="w-full flex gap-12 items-center justify-center">
        {partida.estado === 'contando' && !(soyNegro ? partida.confirmaron.negro : partida.confirmaron.blanco) && (
          <button
            className="bg-indigo-500 text-white px-4 py-2 rounded"
            onClick={() => confirmarConteo(partida.id).catch((e) => toast.error(e.message))}
          >
            Confirmar conteo
          </button>
        )}
        {partida.estado === 'terminada' ? (
          <button className="flex gap-1 items-center bg-indigo-500 text-white px-4 py-2 rounded" onClick={() => storeGo.getState().reset()}>
            <Icon icon={"akar-icons:arrow-back"}/>
            Volver a la sala
          </button>
        ) : (
          <>
            <button className="flex gap-1 items-center text-sm text-ld-violeta-oscuro hover:scale-105 font-bold" onClick={onVolverASala}>
              <Icon className='w-6 h-6' icon={"famicons:arrow-back-circle-outline"}/>
              Volver a la sala
            </button>
            {partida.estado === 'jugando' && (
              <>
                <button
                  className="bg-ld-violeta text-white px-4 py-2 rounded-full disabled:opacity-40 hover:scale-105"
                  disabled={!esMiTurno}
                  onClick={() => pasar(partida.id).catch((e) => toast.error(e.message))}
                >
                  Pasar
                </button>
                <button
                  className="flex gap-1 items-center text-sm rounded-xl p-2 text-rose-500 hover:rotate-3 hover:scale-105 "
                  disabled={confirmando}
                  onClick={() => abandonar(partida.id).catch((e) => toast.error(e.message))}
                >
                  <Icon className='w-6 h-6' icon={'ci:close-circle'}/>
                  Abandonar
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
