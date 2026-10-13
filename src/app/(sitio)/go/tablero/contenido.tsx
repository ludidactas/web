'use client'

import { ElegirModoInvitacion } from '@/components/salas/go/elegir-modo-invitacion'
import { LlamadaDojo } from '@/components/salas/go/llamada-dojo'
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
import { generarImagenResultado } from '@/lib/go-local/imagen-resultado'
import { sonarJugada } from '@/lib/go/sonido-jugada'
import { PiedraIcono } from '@/lib/go/tablero-go-base'
import { cn } from '@/lib/utils'
import { TAMAÑOS_TABLERO, type ModoPartida, type TamañoTablero } from '@/wss/validators/go'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Toaster, toast } from 'sonner'

const PANTALLA_VERTICAL_ANGOSTA = '(max-width: 767px) and (orientation: portrait)'

/** Distancia máxima (px) a la que el scroll se recoloca solo sobre el centro del área de juego. Es chica a
 * propósito: más lejos el scroll queda libre, por ejemplo para dejar a la vista el header del sitio. */
const RADIO_GRAVEDAD_PX = 30
const ESPERA_GRAVEDAD_MS = 150

const NOMBRE = { [NEGRO]: 'Negro', [BLANCO]: 'Blanco' } as const

type Punto = { fila: number; columna: number }

/** Estado del botón "Copiar tablero", que copia la imagen del resultado. */
type CompartirImagen = { copiado: boolean; onCompartir: () => void }

/** "Ganó Negro", "Ganó Blanco" o "Empate", según el resultado de una partida terminada. */
const tituloResultado = (partida: PartidaLocal) =>
  partida.resultado?.ganador === 'empate'
    ? 'Empate'
    : `Ganó ${partida.resultado?.ganador === 'negro' ? 'Negro' : 'Blanco'}`

/** Qué muestra el marcador: capturas de cada color o, desde el conteo, el puntaje (en vivo y luego el final). Las
 * capturas de un jugador se muestran con la piedra del color capturado, así que el orden es blanco-negro en ambos casos. */
function valoresMarcador(partida: PartidaLocal, puntaje: ReturnType<typeof puntajeLocal> | null) {
  return {
    etiqueta: !puntaje ? 'Capturas:' : partida.fase === 'contando' ? 'Conteo:' : 'Puntos:',
    bajoBlanco: puntaje ? puntaje.blanco : partida.capturasNegras,
    bajoNegro: puntaje ? puntaje.negro : partida.capturasBlancas,
  }
}

/** Confirma la jugada elegida (suena si fue legal). Devuelve `false` si no había ninguna elegida. */
function confirmarJugada(pendiente: Punto | null, aplicar: Aplicar): boolean {
  if (!pendiente) return false
  if (aplicar((p) => jugarLocal(p, pendiente.fila, pendiente.columna))) sonarJugada()
  return true
}
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

  // Atajos de teclado. Enter y Espacio confirman la jugada elegida (si el foco está en un botón o dentro de un
  // diálogo, esas teclas ya tienen su efecto propio y no se tocan). La P enfoca "Pasar" y el Espacio siguiente lo
  // activa: pasar lleva dos pasos para no hacerlo por accidente. El Tab, tras tocar el tablero, llega al mismo botón.
  // El `ref` mantiene al día lo que ve el listener, que se registra una vez.
  const confirmarConTeclado = useRef<() => boolean>(() => false)
  confirmarConTeclado.current = () => partida.fase === 'jugando' && confirmarJugada(pendiente, aplicar)
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      const objetivo = e.target instanceof Element ? e.target : null

      if (e.key.toLowerCase() === 'p') {
        if (objetivo?.closest('input, textarea, select, [contenteditable], [role="dialog"]')) return
        // Con "Pasar" ausente o deshabilitado (otra fase, Atari Go, no es su turno) la tecla no hace nada.
        const pasar = [...document.querySelectorAll<HTMLButtonElement>('[data-pasar]')].find(
          (boton) => !boton.disabled && boton.offsetParent !== null
        )
        pasar?.focus()
        return
      }

      if (e.key !== 'Enter' && e.key !== ' ') return
      if (objetivo?.closest('button, a, input, textarea, select, [role="dialog"]')) return
      // Sin jugada elegida no se intercepta: el Espacio sigue scrolleando la página.
      if (confirmarConTeclado.current()) e.preventDefault()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])

  const [copiado, setCopiado] = useState(false)
  /** Copia al portapapeles la imagen del resultado: el tablero tal como se ve, con el marcador y la firma. */
  const compartir = async () => {
    const tablero = areaJuego.current?.querySelector<SVGSVGElement>('svg.touch-none')
    if (!tablero || partida.fase !== 'terminada') return
    const { etiqueta, bajoBlanco, bajoNegro } = valoresMarcador(partida, puntaje)
    try {
      // El blob se pasa como promesa: Safari exige armar el ClipboardItem dentro del click.
      const imagen = generarImagenResultado({
        tablero,
        tamañoTablero: partida.tamaño,
        titulo: tituloResultado(partida),
        modo: ETIQUETA_MODO[partida.modo],
        etiquetaMarcador: etiqueta,
        bajoBlanco,
        bajoNegro,
      })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': imagen })])
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('No se pudo copiar la imagen. Probá con otro navegador.')
    }
  }
  const compartirImagen: CompartirImagen = { copiado, onCompartir: compartir }

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
        <PanelJugador
          color={BLANCO}
          partida={partida}
          pendiente={pendiente}
          aplicar={aplicar}
          compartir={compartirImagen}
          className="rotate-180"
        />

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
                <Acciones
                  color={null}
                  partida={partida}
                  pendiente={pendiente}
                  aplicar={aplicar}
                  compartir={compartirImagen}
                />
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

        <PanelJugador
          color={NEGRO}
          partida={partida}
          pendiente={pendiente}
          aplicar={aplicar}
          compartir={compartirImagen}
        />
      </div>

      {/* Debajo del área de juego: en celular vertical, ésta mide una pantalla, así que la llamada queda fuera de vista
          con el tablero centrado y se llega a ella scrolleando. */}
      <LlamadaDojo className="mt-10 max-md:portrait:mt-0" />
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
        <p className={titulo}>{tituloResultado(partida)}</p>
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
  const { etiqueta, bajoBlanco, bajoNegro } = valoresMarcador(partida, puntaje)

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

/**
 * Etiqueta de un botón con, debajo y en bajo contraste, la tecla que lo activa. La tecla solo se muestra donde hay
 * teclado: con puntero fino que flota (mouse o trackpad: `hover: hover` y `pointer: fine`) y fuera del layout de
 * celular en vertical, que también aparece al achicar la ventana de un escritorio. El `span` exterior oculta ese
 * layout y el interior el resto de los dispositivos táctiles.
 */
function EtiquetaConAtajo({ atajo, children }: { atajo: string; children: ReactNode }) {
  return (
    <span className="flex flex-col items-center leading-tight">
      {children}
      <span className="max-md:portrait:hidden">
        <span className="hidden [@media(hover:hover)_and_(pointer:fine)]:block text-[10px] font-normal text-white/70">
          {atajo}
        </span>
      </span>
    </span>
  )
}

/** Confirmar/pasar de `color` (solo habilitados en su turno), o de quien juegue si `color` es `null`. */
function Acciones({
  color,
  partida,
  pendiente,
  aplicar,
  compartir,
}: {
  color: Color | null
  partida: PartidaLocal
  pendiente: Punto | null
  aplicar: Aplicar
  compartir: CompartirImagen
}) {
  const esSuTurno = color === null || partida.turno === color

  if (partida.fase === 'jugando')
    return (
      <>
        <button
          type="button"
          disabled={!pendiente || !esSuTurno}
          onClick={() => confirmarJugada(pendiente, aplicar)}
          // Se confirma con Enter o Espacio sin pasar por el foco: así, tras tocar el tablero, el siguiente Tab cae en "Pasar".
          tabIndex={-1}
          className="bg-emerald-500 text-white px-4 py-2 rounded-full disabled:opacity-40 enabled:hover:scale-105"
        >
          <EtiquetaConAtajo atajo="Espacio">Confirmar jugada</EtiquetaConAtajo>
        </button>
        {partida.modo !== 'atari' && (
          <button
            type="button"
            disabled={!esSuTurno}
            onClick={(e) => {
              aplicar(pasarLocal)
              // Sin el foco encima, un Espacio de más no vuelve a pasar: dos pases seguidos terminan la partida.
              e.currentTarget.blur()
            }}
            data-pasar
            className="bg-ld-violeta text-white px-4 py-2 rounded-full disabled:opacity-40 enabled:hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ld-violeta-oscuro/40 focus-visible:ring-offset-2"
          >
            <EtiquetaConAtajo atajo="P, luego Espacio">Pasar</EtiquetaConAtajo>
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

  if (partida.fase === 'terminada') return <BotonCompartir {...compartir} />

  return null
}

/** Copia la imagen del resultado; mientras confirma la copia, avisa "Imagen copiada". */
function BotonCompartir({ copiado, onCompartir }: CompartirImagen) {
  return (
    <button
      type="button"
      onClick={onCompartir}
      className={cn(
        'flex items-center gap-1 px-4 py-2 rounded-full text-white transition-colors active:scale-95',
        copiado ? 'bg-emerald-500' : 'bg-ld-azul hover:bg-ld-azul/80'
      )}
    >
      <Icon icon={copiado ? 'lucide:check' : 'lucide:copy'} width={16} height={16} />
      {copiado ? 'Imagen copiada' : 'Copiar tablero'}
    </button>
  )
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
      onClick={(e) => {
        aplicar((p) => alternarConformidadLocal(p, color))
        // Sin el foco encima, un Espacio de más no alterna la conformidad sin querer.
        e.currentTarget.blur()
      }}
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
  compartir,
  className,
}: {
  color: Color
  partida: PartidaLocal
  pendiente: Punto | null
  aplicar: Aplicar
  compartir: CompartirImagen
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
        <Acciones color={color} partida={partida} pendiente={pendiente} aplicar={aplicar} compartir={compartir} />
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
