'use client'

import { Outlined } from '@/components/fx/filtros'
import { ETIQUETA_MODO, infoExport, jugadoresImagen, modoYFechaImagen, TEXTO_MOTIVO_FIN } from '@/lib/go/info-export'
import { BLANCO, Color, NEGRO } from '@/lib/go/motor'
import { PiedraIcono } from '@/lib/go/tablero-go-base'
import { cn } from '@/lib/utils'
import BlancoGana from '@/svg/dist/ilustraciones/BlancoGana.svg'
import BlancoPierde from '@/svg/dist/ilustraciones/BlancoPierde.svg'
import Empate from '@/svg/dist/ilustraciones/Empate.svg'
import HudBlanco from '@/svg/dist/ilustraciones/HudBlanco.svg'
import HudNegro from '@/svg/dist/ilustraciones/HudNegro.svg'
import NegroGana from '@/svg/dist/ilustraciones/NegroGana.svg'
import NegroPierde from '@/svg/dist/ilustraciones/NegroPierde.svg'
import { Partida } from '@/wss/validators/go'
import { ReglasGo } from './reglas-go'

const NOMBRE_COLOR = { [NEGRO]: 'Negro', [BLANCO]: 'Blanco' } as const

/** Encabezado de la partida: blanco siempre a la izquierda y negro a la derecha. Mientras se juega
 * muestra a los dos gatos, los nombres y de quién es el turno; con `final`, el resultado y el
 * resumen de la partida. `miColor` queda sin definir para quien observa una partida ajena. */
export function HudPartida({ partida, miColor, final }: { partida: Partida; miColor?: Color; final: boolean }) {
  return final ? <HudFinal partida={partida} /> : <HudEnJuego partida={partida} miColor={miColor} />
}

function HudEnJuego({ partida, miColor }: { partida: Partida; miColor?: Color }) {
  return (
    <div className="w-full max-w-md sm:max-w-xl flex flex-col items-center">
      <div className="relative w-full h-44 rounded-t-[2.5rem] bg-gradient-to-r from-ld-azul/35 to-ld-violeta/35 overflow-hidden">
        <HudBlanco className="absolute bottom-5 sm:bottom-6 left-0 h-24 sm:h-28 w-auto" />
        <HudNegro className="absolute bottom-5 sm:bottom-6 right-0 h-24 sm:h-28 w-auto" />

        <ChipColor color={BLANCO} className="absolute top-3 left-4" />
        <ChipColor color={NEGRO} className="absolute top-3 right-4" />

        {/* En pantallas chicas el texto sube para no pisar las cabezas de los gatos. */}
        <div className="absolute inset-x-0 top-0 bottom-10 sm:bottom-0 flex flex-col items-center justify-center">
          <CentroEnJuego partida={partida} miColor={miColor} />
        </div>

        <PestañaNombre
          texto={miColor === BLANCO ? 'TU' : partida.blanco.nombre}
          className="left-0 rounded-tr-2xl border-r-2"
        />
        <PestañaNombre
          texto={miColor === NEGRO ? 'TU' : partida.negro.nombre}
          className="right-0 rounded-tl-2xl border-l-2 justify-end"
        />
      </div>

      <div className="-mt-3 z-10 bg-white border-2 border-ld-violeta rounded-xl px-3 py-1">
        <ReglasGo />
      </div>
    </div>
  )
}

function CentroEnJuego({ partida, miColor }: { partida: Partida; miColor?: Color }) {
  if (partida.estado === 'contando') return <TextoGrande color={NEGRO}>Conteo</TextoGrande>
  if (partida.estado !== 'jugando') return null

  const esMiTurno = partida.turno === miColor
  return (
    <>
      {partida.modo === 'atari' && (
        <span className="text-sm font-bold text-indigo-600">{ETIQUETA_MODO[partida.modo]}</span>
      )}
      {/* La piedra cuelga a la izquierda del texto, así el que queda centrado es el texto. */}
      <div className={cn('relative flex items-center', esMiTurno && 'animate-pulse')}>
        <PiedraIcono
          color={partida.turno}
          className="absolute right-full mr-2 h-5 w-5 sm:h-6 sm:w-6"
        />
        <TextoGrande color={partida.turno}>
          {esMiTurno ? 'Tu turno' : `Juega ${NOMBRE_COLOR[partida.turno]}`}
        </TextoGrande>
      </div>
    </>
  )
}

/** Texto en el color de las piedras: blanco con contorno negro, o negro liso. */
function TextoGrande({ color, children }: { color: Color; children: React.ReactNode }) {
  const texto = <span className="text-xl sm:text-[1.6rem] font-bold tracking-wide whitespace-nowrap">{children}</span>
  return color === BLANCO ? (
    <Outlined radius={1.5} outlineColor="black" className="text-white">
      {texto}
    </Outlined>
  ) : (
    <span className="text-neutral-900">{texto}</span>
  )
}

function ChipColor({ color, className }: { color: Color; className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 bg-white border-2 border-ld-violeta rounded-lg px-2 text-sm font-semibold',
        color === NEGRO && 'flex-row-reverse',
        className
      )}
    >
      <PiedraIcono color={color} className="h-3.5 w-3.5" />
      {NOMBRE_COLOR[color]}
    </span>
  )
}

function PestañaNombre({ texto, className }: { texto: string; className?: string }) {
  return (
    <span
      className={cn(
        'absolute bottom-0 flex w-32 h-9 items-center px-4 bg-white border-t-2 border-ld-violeta text-lg font-semibold',
        className
      )}
    >
      <span className="truncate">{texto}</span>
    </span>
  )
}

/** Blanco a la izquierda y negro a la derecha, cada uno ganando o perdiendo según el resultado. */
const ILUSTRACIONES_FINAL = {
  [BLANCO]: { izq: BlancoGana, der: NegroPierde },
  [NEGRO]: { izq: BlancoPierde, der: NegroGana },
}

/** Con empate, una sola ilustración (los dos gatos juntos) en la mitad izquierda y el texto en la
 * derecha. */
function HudFinal({ partida }: { partida: Partida }) {
  const info = infoExport(partida)
  const colorGanador = info.ganador === null ? null : info.ganador === 'negro' ? NEGRO : BLANCO
  const ilustraciones = colorGanador === null ? null : ILUSTRACIONES_FINAL[colorGanador]

  return (
    <div className="relative w-full max-w-md sm:max-w-xl h-44 rounded-[3rem] border-2 border-ld-violeta bg-gradient-to-r from-ld-azul/35 to-ld-violeta/35 overflow-hidden">
      {ilustraciones && (
        <>
          {/* Centradas a la misma distancia de cada borde, sin importar el ancho de cada dibujo. */}
          <ilustraciones.izq className="absolute bottom-3 left-[13%] sm:left-[17%] -translate-x-1/2 h-20 sm:h-28 w-auto max-w-[22%] sm:max-w-[28%]" />
          <ilustraciones.der className="absolute bottom-3 right-[13%] sm:right-[17%] translate-x-1/2 h-20 sm:h-28 w-auto max-w-[22%] sm:max-w-[28%]" />
        </>
      )}
      {colorGanador === null && (
        <div className="absolute top-4 bottom-2 left-0 w-1/2 flex justify-center">
          <Empate className="h-full w-auto max-w-full" />
        </div>
      )}

      <div
        className={cn(
          'absolute inset-y-0 flex flex-col items-center justify-center gap-0.5 text-center text-[11px] leading-tight text-slate-700',
          colorGanador === null ? 'left-1/2 right-0' : 'inset-x-[24%]'
        )}
      >
        <Outlined radius={1.5} outlineColor="black" className="text-white mb-1">
          <span className="text-2xl font-bold tracking-wide whitespace-nowrap">
            {colorGanador === null ? 'Empate' : `Ganó ${NOMBRE_COLOR[colorGanador]}`}
          </span>
        </Outlined>
        <p>{modoYFechaImagen(info, partida.creadaEn)}</p>
        <p>{jugadoresImagen(info)}</p>
        {info.puntos && (
          <p>
            Negro {info.puntos.negro} — Blanco {info.puntos.blanco}
          </p>
        )}
        {info.motivoFin && info.motivoFin !== 'conteo' && <p>{TEXTO_MOTIVO_FIN[info.motivoFin]}</p>}

        {/* Cada número va con el ícono del color CAPTURADO (ver `PanelCapturas` en go-juego). */}
        <p className="mt-1">Capturas</p>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <PiedraIcono color={NEGRO} className="h-3 w-3" /> {partida.capturasBlancas}
          </span>
          <span className="inline-flex items-center gap-1">
            <PiedraIcono color={BLANCO} className="h-3 w-3" /> {partida.capturasNegras}
          </span>
        </span>
      </div>
    </div>
  )
}
