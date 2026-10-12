'use client'

import { ElegirModoInvitacion } from '@/components/salas/go/elegir-modo-invitacion'
import { PartidaGo } from '@/components/salas/go/partida-go'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  alternarConformidadLocal,
  jugarLocal,
  marcarMuertaLocal,
  pasarLocal,
  puntajeLocal,
  type PartidaLocal,
} from '@/lib/go-local/partida-local'
import { storeTableroLocal } from '@/lib/go-local/store-tablero'
import { BLANCO, NEGRO, type Color } from '@/lib/go/motor'
import { sonarJugada } from '@/lib/go/sonido-jugada'
import { PiedraIcono } from '@/lib/go/tablero-go-base'
import { cn } from '@/lib/utils'
import { TAMAÑOS_TABLERO, type ModoPartida, type TamañoTablero } from '@/wss/validators/go'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'

const PANTALLA_VERTICAL_ANGOSTA = '(max-width: 767px) and (orientation: portrait)'

/** Distancia máxima (px) a la que el scroll se recoloca solo sobre el centro del área de juego. Es chica a
 * propósito: más lejos el scroll queda libre, por ejemplo para dejar a la vista el header del sitio. */
const RADIO_GRAVEDAD_PX = 30
const ESPERA_GRAVEDAD_MS = 150

const NOMBRE = { [NEGRO]: 'Negro', [BLANCO]: 'Blanco' } as const

type Punto = { fila: number; columna: number }
/** Aplica una transición de la partida; devuelve `false` (y avisa el motivo) si era ilegal. */
type Aplicar = (transicion: (p: PartidaLocal) => PartidaLocal) => boolean

/** Tablero de Go para dos personas en el mismo dispositivo: se turnan para jugar. Hay una partida por
 * tamaño (9x9, 13x13 y 19x19), guardadas en el dispositivo; elegir un tamaño solo cambia cuál se muestra.
 * La lógica de la partida vive en `@/lib/go-local/partida-local`; acá solo se arma la UI.
 *
 * Con el celular en vertical (`max-md:portrait:`) los jugadores se sientan a los extremos del
 * dispositivo: cada uno tiene su panel de acciones (el de Blanco girado 180°), a un costado del
 * tablero va una franja girada 90° con lo común (turno y capturas) y, al otro, otra con los tamaños y
 * "Nueva partida". En cualquier otra pantalla esos bloques se acomodan arriba y abajo del tablero. */
export default function ContenidoTablero() {
  const tamaño = storeTableroLocal((s) => s.tamaño)
  const partida = storeTableroLocal((s) => s.partidas[s.tamaño])
  const { setTamaño, setPartida, nuevaPartida } = storeTableroLocal.getState()

  // El servidor no conoce lo guardado: hasta rehidratar, el tablero ocupa su lugar pero no se ve.
  const [hidratado, setHidratado] = useState(false)
  useEffect(() => {
    void Promise.resolve(storeTableroLocal.persist.rehydrate()).finally(() => setHidratado(true))
  }, [])

  // Intersección elegida pero todavía sin confirmar: en un dispositivo compartido evita jugadas por un toque de más.
  const [pendiente, setPendiente] = useState<Punto | null>(null)

  const areaJuego = useRef<HTMLDivElement>(null)
  // En celular vertical, al cargar el área de juego se centra en pantalla (el header y el pie quedan fuera).
  useEffect(() => {
    if (hidratado && window.matchMedia(PANTALLA_VERTICAL_ANGOSTA).matches)
      areaJuego.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [hidratado])

  // Gravedad suave: al dejar de scrollear (y sin el dedo apoyado), si el área de juego quedó a pocos px de estar
  // centrada, se termina de centrar.
  useEffect(() => {
    const verticalAngosta = window.matchMedia(PANTALLA_VERTICAL_ANGOSTA)
    let temporizador: ReturnType<typeof setTimeout>
    let tocando = false

    const centrarSiEstaCerca = () => {
      const area = areaJuego.current
      if (!area || tocando || !verticalAngosta.matches) return
      const { top, height } = area.getBoundingClientRect()
      const distancia = top + height / 2 - window.innerHeight / 2
      if (Math.abs(distancia) > 1 && Math.abs(distancia) <= RADIO_GRAVEDAD_PX)
        window.scrollBy({ top: distancia, behavior: 'smooth' })
    }
    const programar = () => {
      clearTimeout(temporizador)
      temporizador = setTimeout(centrarSiEstaCerca, ESPERA_GRAVEDAD_MS)
    }
    const alApoyar = () => (tocando = true)
    const alSoltar = () => {
      tocando = false
      programar()
    }

    window.addEventListener('scroll', programar, { passive: true })
    window.addEventListener('touchstart', alApoyar, { passive: true })
    window.addEventListener('touchend', alSoltar, { passive: true })
    window.addEventListener('touchcancel', alSoltar, { passive: true })
    return () => {
      clearTimeout(temporizador)
      window.removeEventListener('scroll', programar)
      window.removeEventListener('touchstart', alApoyar)
      window.removeEventListener('touchend', alSoltar)
      window.removeEventListener('touchcancel', alSoltar)
    }
  }, [])

  // Puntaje en vivo durante el conteo y el final al terminar; en el resto de la partida no hay puntaje que mostrar.
  // Atari Go no se cuenta: gana quien captura primero, así que el marcador sigue mostrando las capturas.
  const puntaje = useMemo(
    () =>
      partida.modo === 'atari'
        ? null
        : partida.fase === 'contando'
          ? puntajeLocal(partida)
          : partida.fase === 'terminada'
            ? partida.resultado
            : null,
    [partida]
  )

  const aplicar: Aplicar = (transicion) => {
    try {
      setPartida(transicion(partida))
      setPendiente(null)
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Jugada inválida')
      return false
    }
  }

  const elegirTamaño = (t: TamañoTablero) => {
    setTamaño(t)
    setPendiente(null)
  }
  /** Empieza una partida nueva en el tamaño que se está mirando, en el modo dado. */
  const empezar = (m: ModoPartida) => {
    nuevaPartida(m)
    setPendiente(null)
  }

  const controlesDeTablero = (
    <>
      <Tamaños tamaño={tamaño} onElegir={elegirTamaño} />
      <NuevaPartida partida={partida} onElegir={empezar} />
    </>
  )

  return (
    <div className="flex flex-col items-center w-full max-w-xl px-4 pt-16 max-md:portrait:pt-4 pb-32 max-md:portrait:pb-8 gap-6">
      <Toaster position="top-center" richColors />
      <h1 className="text-3xl md:text-5xl text-ld-violeta-oscuro text-center max-md:portrait:hidden">Tablero de Go</h1>

      <div
        ref={areaJuego}
        className={cn(
          'flex flex-col items-center gap-4 w-full max-md:portrait:min-h-lvh max-md:portrait:justify-center max-md:portrait:gap-8 max-md:portrait:py-4',
          !hidratado && 'invisible'
        )}
      >
        <PanelJugador color={BLANCO} partida={partida} pendiente={pendiente} aplicar={aplicar} className="rotate-180" />

        <div className="relative flex justify-center w-full">
          <div className="flex flex-col items-center gap-4 flex-1 min-w-0 max-md:portrait:px-9">
            <div className="max-md:portrait:hidden w-full flex flex-col items-center gap-4">
              <Estado partida={partida} />
              {partida.fase === 'jugando' && partida.historial.length === 0 && (
                <p className="text-sm text-slate-500 text-center">
                  {partida.modo === 'atari'
                    ? 'Atari Go: gana quien captura primero. Negro empieza.'
                    : 'Tablero vacío: Negro empieza.'}{' '}
                  Toquen una intersección y confirmen la jugada.
                </p>
              )}
            </div>

            <div className="max-md:portrait:hidden w-full max-w-[min(90vw,560px)] flex items-center justify-between">
              {controlesDeTablero}
            </div>

            <PartidaGo
              tablero={partida.tablero}
              tamaño={partida.tamaño}
              removidas={partida.removidas}
              vivo={partida.vivo}
              modoConteo={partida.fase === 'contando'}
              miColor={partida.fase === 'jugando' ? partida.turno : undefined}
              turno={partida.fase === 'jugando' ? partida.turno : undefined}
              esMiTurno={partida.fase === 'jugando'}
              ultimaJugada={partida.ultimaJugada}
              pendiente={partida.fase === 'jugando' ? pendiente : null}
              deshabilitado={partida.fase === 'terminada'}
              onJugar={(fila, columna) => {
                if (partida.fase === 'contando') return aplicar((p) => marcarMuertaLocal(p, fila, columna))
                // Tocar la intersección ya elegida la cancela; tocar otra reemplaza la selección.
                setPendiente((actual) =>
                  actual?.fila === fila && actual.columna === columna ? null : { fila, columna }
                )
              }}
            />

            <div className="max-md:portrait:hidden flex flex-col items-center gap-4">
              <Marcador partida={partida} puntaje={puntaje} />
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Acciones color={null} partida={partida} pendiente={pendiente} aplicar={aplicar} />
              </div>
            </div>
          </div>

          {/* Franjas superpuestas a los costados del tablero: toman su altura sin agrandarla con su texto. */}
          <div className="hidden max-md:portrait:flex absolute inset-y-0 left-0 w-8 overflow-hidden whitespace-nowrap [writing-mode:vertical-rl] items-center justify-between gap-1 py-1 text-sm">
            {controlesDeTablero}
          </div>
          <div className="hidden max-md:portrait:flex absolute inset-y-0 right-0 w-9 overflow-hidden whitespace-nowrap [writing-mode:vertical-rl] items-center justify-between gap-1 py-1 text-sm">
            <Estado partida={partida} compacto />
            <Marcador partida={partida} puntaje={puntaje} compacto />
          </div>
        </div>

        <PanelJugador color={NEGRO} partida={partida} pendiente={pendiente} aplicar={aplicar} />
      </div>
    </div>
  )
}

const ETIQUETA_MODO: Record<ModoPartida, string> = { partida: 'Partida por territorio', atari: 'Atari Go' }

/** El modo de la partida, en letra mínima, debajo del título de estado. */
function EtiquetaModo({ modo }: { modo: ModoPartida }) {
  return <span className="text-[10px] leading-none text-slate-400">{ETIQUETA_MODO[modo]}</span>
}

/** Quién juega, el conteo en vivo o el resultado, con el modo de la partida debajo: información de la partida, no de un jugador. */
function Estado({ partida, compacto }: { partida: PartidaLocal; compacto?: boolean }) {
  const titulo = cn('font-bold', compacto ? 'text-sm' : 'text-xl')

  // El ícono de la piedra queda centrado con el alto del título y la etiqueta juntos.
  if (partida.fase === 'jugando')
    return (
      <div className="flex items-center gap-2">
        <PiedraIcono color={partida.turno} className="h-5 w-5" />
        <div className="flex flex-col items-start">
          <p className={titulo}>Juega {NOMBRE[partida.turno].toLowerCase()}</p>
          <EtiquetaModo modo={partida.modo} />
        </div>
      </div>
    )

  if (partida.fase === 'contando')
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex flex-col items-start gap-0.5">
          <p className={cn('flex items-center gap-1', titulo)}>
            Confirmar capturas
            {compacto && <AyudaConteo />}
          </p>
          <EtiquetaModo modo={partida.modo} />
        </div>
        {!compacto && (
          <p className="text-sm text-slate-500 text-center">
            Toquen las piedras muertas para marcarlas, y confirmen el conteo.
          </p>
        )}
      </div>
    )

  if (partida.fase === 'terminada' && partida.resultado)
    return (
      <div className="flex flex-col items-start gap-0.5">
        <p className={titulo}>
          {partida.resultado.ganador === 'empate'
            ? 'Empate'
            : `Ganó ${partida.resultado.ganador === 'negro' ? 'Negro' : 'Blanco'}`}
        </p>
        <EtiquetaModo modo={partida.modo} />
      </div>
    )

  return null
}

/** Capturas de cada color o, desde el conteo, el puntaje (en vivo y luego el final): mismo formato (ícono y número). Las
 * capturas de un jugador se muestran con la piedra del color capturado, así que el orden es blanco-negro
 * en ambos casos. */
function Marcador({
  partida,
  puntaje,
  compacto,
}: {
  partida: PartidaLocal
  puntaje: ReturnType<typeof puntajeLocal> | null
  compacto?: boolean
}) {
  const etiqueta = !puntaje ? 'Capturas:' : partida.fase === 'contando' ? 'Conteo:' : 'Puntos:'
  const bajoBlanco = puntaje ? puntaje.blanco : partida.capturasNegras
  const bajoNegro = puntaje ? puntaje.negro : partida.capturasBlancas

  return (
    <p className={cn('flex items-center text-sm font-semibold text-slate-600', compacto ? 'gap-1' : 'gap-3')}>
      {compacto ? null : etiqueta}
      <span className="inline-flex items-center gap-1">
        <PiedraIcono color={BLANCO} className="h-4 w-4" /> {bajoBlanco}
      </span>
      <span className="inline-flex items-center gap-1">
        <PiedraIcono color={NEGRO} className="h-4 w-4" /> {bajoNegro}
      </span>
    </p>
  )
}

/** Confirmar/pasar de `color` (solo habilitados en su turno), o de quien juegue si `color` es `null`. */
function Acciones({
  color,
  partida,
  pendiente,
  aplicar,
}: {
  color: Color | null
  partida: PartidaLocal
  pendiente: Punto | null
  aplicar: Aplicar
}) {
  const esSuTurno = color === null || partida.turno === color

  if (partida.fase === 'jugando')
    return (
      <>
        <button
          type="button"
          disabled={!pendiente || !esSuTurno}
          onClick={() => {
            if (pendiente && aplicar((p) => jugarLocal(p, pendiente.fila, pendiente.columna))) sonarJugada()
          }}
          className="bg-emerald-500 text-white px-4 py-2 rounded-full disabled:opacity-40 enabled:hover:scale-105"
        >
          Confirmar jugada
        </button>
        {partida.modo !== 'atari' && (
          <button
            type="button"
            disabled={!esSuTurno}
            onClick={() => aplicar(pasarLocal)}
            className="bg-ld-violeta text-white px-4 py-2 rounded-full disabled:opacity-40 enabled:hover:scale-105"
          >
            Pasar
          </button>
        )}
      </>
    )

  if (partida.fase === 'contando')
    return color === null ? (
      <>
        <BotonConformidad color={NEGRO} partida={partida} aplicar={aplicar} conIcono />
        <BotonConformidad color={BLANCO} partida={partida} aplicar={aplicar} conIcono />
      </>
    ) : (
      <BotonConformidad color={color} partida={partida} aplicar={aplicar} />
    )

  return null
}

/** Conformidad de `color` con el conteo: un toque la da y otro la retira. La partida termina con las dos. */
function BotonConformidad({
  color,
  partida,
  aplicar,
  conIcono,
}: {
  color: Color
  partida: PartidaLocal
  aplicar: Aplicar
  conIcono?: boolean
}) {
  const conforme = partida.confirmaron[color === NEGRO ? 'negro' : 'blanco']

  return (
    <button
      type="button"
      aria-pressed={conforme}
      onClick={() => aplicar((p) => alternarConformidadLocal(p, color))}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full hover:scale-105',
        conforme ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'
      )}
    >
      {conIcono && <PiedraIcono color={color} className="h-4 w-4" />}
      {conforme ? 'Conforme ✓' : 'Confirmar conteo'}
    </button>
  )
}

/** Panel de un jugador (celular en vertical): su color y sus acciones, orientados hacia él. */
function PanelJugador({
  color,
  partida,
  pendiente,
  aplicar,
  className,
}: {
  color: Color
  partida: PartidaLocal
  pendiente: Punto | null
  aplicar: Aplicar
  className?: string
}) {
  return (
    <div className={cn('hidden max-md:portrait:flex flex-col items-center gap-2 w-full', className)}>
      <p
        className={cn(
          'flex items-center gap-2 font-bold',
          partida.fase === 'jugando' && partida.turno === color ? 'text-lg' : 'text-sm text-slate-400'
        )}
      >
        <PiedraIcono color={color} className="h-4 w-4" />
        {NOMBRE[color]}
        {partida.fase === 'jugando' && partida.turno === color && ' — tu turno'}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Acciones color={color} partida={partida} pendiente={pendiente} aplicar={aplicar} />
      </div>
    </div>
  )
}

const CLASE_TEXTBUTTON = 'text-sm underline text-slate-500 disabled:no-underline disabled:opacity-40'

/** Los tres tamaños de tablero: cada uno conserva su propia partida. */
function Tamaños({ tamaño, onElegir }: { tamaño: TamañoTablero; onElegir: (t: TamañoTablero) => void }) {
  return (
    <div className="flex items-center gap-3">
      {TAMAÑOS_TABLERO.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onElegir(t)}
          aria-pressed={tamaño === t}
          className={cn(CLASE_TEXTBUTTON, tamaño === t && 'font-bold text-ld-violeta-oscuro')}
        >
          {t}x{t}
        </button>
      ))}
    </div>
  )
}

/** Hay una partida empezada y sin terminar: reemplazarla se pierde. */
const hayPartidaEnCurso = (partida: PartidaLocal) =>
  (partida.historial.length > 0 || partida.pases > 0) && partida.fase !== 'terminada'

/** Empieza una partida nueva en el tablero que se está mirando: pregunta el modo y avisa si se pierde una en curso. */
function NuevaPartida({ partida, onElegir }: { partida: PartidaLocal; onElegir: (modo: ModoPartida) => void }) {
  return (
    <ElegirModoInvitacion
      titulo="Nueva partida: ¿a qué juegan?"
      aviso={hayPartidaEnCurso(partida) ? 'Se pierde la partida en curso de este tablero.' : undefined}
      onElegir={onElegir}
    >
      <button type="button" className={CLASE_TEXTBUTTON}>
        Nueva partida
      </button>
    </ElegirModoInvitacion>
  )
}

/** Explica cómo se hace el conteo; reemplaza en pantallas angostas al renglón de instrucciones. */
function AyudaConteo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label="Cómo se cuenta" className="text-slate-500">
          <Icon icon="lucide:circle-help" className="h-4 w-4 rotate-90" />
        </button>
      </DialogTrigger>
      <DialogContent className="flex flex-col items-center rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-center leading-6">Cómo se cuenta</DialogTitle>
          <DialogDescription className="text-center leading-6">
            Toquen las cadenas sueltas que quedaron dentro del territorio de cada color para marcarlas como muertas. El
            conteo se actualiza con cada marca; cuando estén de acuerdo, confirmen el conteo.
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <button className="bg-slate-200 px-4 py-2 min-w-32 rounded-full">Entendido</button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
