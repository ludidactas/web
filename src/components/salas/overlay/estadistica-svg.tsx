'use client'
import { Outlined } from '@/components/fx/filtros'
import useScrambleText from '@/components/hooks/use-scramble-text'
import { StatusDeConexion } from '@/wss-cli/conexion-wss'
import { useConexionOverlay } from '@/wss-cli/providers/wss-overlay-context'
import { overlayEncuestaStore } from '@/wss-cli/stores/overlay-encuestas-store'
import { EncuestaConVotos, OpcionConVotos } from '@/wss/validators/polls'
import { Icon } from '@iconify/react/dist/iconify.js'
import { motion, useAnimationControls } from 'framer-motion'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { isNullish } from 'remeda'
import { EstadisticaSvgConfig } from './estadistica-svg-config'

// Alto reservado para la etiqueta del texto, que va siempre encima de la barra.
const ALTO_ETIQUETA = 28

// Interlineado del título; se usa para renderizar Y para derivar su alto (deben coincidir).
const TITULO_LINE_HEIGHT = 1.2

// Layout horizontal del SVG (viewBox de 1000 de ancho).
const ANCHO_SVG = 1000
const FIN_BARRA = 810 // x donde la barra llega al 100%
const X_VALOR = FIN_BARRA + 12 // inicio de la caja de votos/porcentaje
const ANCHO_VALOR = ANCHO_SVG - X_VALOR // el resto del ancho, para que la manito no se clipee
const ALTO_MIN_VALOR = 56 // alto mínimo de la caja de valor: headroom para el texto y el bump de escala de la manito
const MIN_ANCHO_BARRA = 6 // ancho mínimo de la barra: deja ver el slot aunque la opción tenga 0 votos

export default function EstadisticaLiveSvg({ config }: { config: EstadisticaSvgConfig }) {
  // Agarramos la encuesta del server, accediendo a la sala como si fueramos estudiante
  const { estado, error } = useConexionOverlay()
  const { encuesta } = overlayEncuestaStore()

  return (
    <div className="w-full">
      {error && <p className="text-red-500">Error: {error}</p>}
      {estado === StatusDeConexion.Conectado && encuesta && (
        <motion.div
          key={encuesta.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <EncuestaSVG encuesta={encuesta} config={config} />
        </motion.div>
      )}
    </div>
  )
}

// Componente para una encuesta individual
export function EncuestaSVG({ encuesta, config }: { encuesta: EncuestaConVotos; config: EstadisticaSvgConfig }) {
  if (isNullish(encuesta)) {
    return (
      <div className="bg-transparent w-full rounded-xl">
        <p className="text-center text-slate-400 p-4">No hay encuestas enfocadas</p>
      </div>
    )
  }
  const maxVotos = Math.max(...encuesta.opciones.map((op) => op.votos))
  const totalVotos = encuesta.opciones.reduce((sum, op) => sum + op.votos, 0)

  const ids = encuesta.opciones.map((op) => op.id)

  const ops = encuesta.opciones
    .toSorted((a, b) => b.votos - a.votos)
    .map((opc) => ({ ...opc, texto: encuesta.isRevealed ? opc.texto : '?????' }))

  // Renombramos los que cambiaron a castellano en zod a su antiguo nombre original en inglés
  const {
    fondo: bg,
    radioFondo,
    altoBarra: barHeight,
    espacioBarras: barSpacing,
    margen: paddingInterno,
    radioBarra: barRadius,
    colorTexto,
    colorContorno,
    colores,
    colorValor,
    colorValorAlterno: colorValorAlt,
  } = config

  // El título no entra en una sola línea fija: encogemos la fuente y permitimos más líneas según
  // el largo del texto. El foreignObject hace el wrap; si excede `tituloLineas` se trunca con elipsis.
  const largoPregunta = encuesta.pregunta.length
  const { fontSize: tituloFontSize, lineas: tituloLineas } =
    largoPregunta > 140
      ? { fontSize: 16, lineas: 3 }
      : largoPregunta > 80
      ? { fontSize: 20, lineas: 2 }
      : largoPregunta > 40
      ? { fontSize: 24, lineas: 2 }
      : { fontSize: 28, lineas: 2 }

  // Derivamos el alto del título de las líneas/tamaño elegidos (en vez de un valor fijo y frágil),
  // así las líneas visibles nunca se clipean y el excedente cae en la elipsis del line-clamp.
  const titleHeight = Math.ceil(tituloLineas * tituloFontSize * TITULO_LINE_HEIGHT) + 12

  // Cada fila = etiqueta (arriba) + barra; el paso vertical suma el gap (barSpacing), así el
  // espacio entre barras se mantiene constante aunque crezca barHeight.
  const pasoVertical = ALTO_ETIQUETA + barHeight + barSpacing

  // Calcular dimensiones
  const svgHeight = titleHeight + encuesta.opciones.length * pasoVertical + 20

  return (
    <div
      className="w-full"
      style={{ backgroundColor: bg, margin: 2, padding: `${paddingInterno}px`, borderRadius: `${radioFondo}px` }}
    >
      <svg className="w-full" viewBox={`0 0 1000 ${svgHeight}`}>
        {/* Título de la encuesta */}
        <foreignObject x="20" y="0" width="960" height={titleHeight}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <Outlined outlineColor={colorContorno} radius={2.5} className="block w-full px-1">
              <div
                style={{
                  color: colorTexto,
                  fontSize: `${tituloFontSize}px`,
                  fontWeight: 'bold',
                  lineHeight: TITULO_LINE_HEIGHT,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: tituloLineas,
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                  width: '100%',
                }}
              >
                {encuesta.pregunta}
              </div>
            </Outlined>
          </div>
        </foreignObject>

        {/* Barras */}
        {ops.map((op) => (
          <motion.g
            key={op.id}
            initial={false}
            animate={{
              transform: `translate(0, ${titleHeight + 20 + ops.indexOf(op) * pasoVertical}px)`,
            }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }} // or use ease: "easeInOut"
          >
            <BarraEstadistica
              percentage={totalVotos > 0 ? op.votos / totalVotos : 0}
              maxPercentage={maxVotos > 0 ? maxVotos / totalVotos : 0}
              barColor={colores[ids.indexOf(op.id) % colores.length]}
              opcion={op}
              barHeight={barHeight}
              barRadius={barRadius}
              colorTexto={colorTexto}
              colorContorno={colorContorno}
              colorValor={colorValor}
              colorValorAlt={colorValorAlt}
            />
          </motion.g>
        ))}
      </svg>
    </div>
  )
}

// Componente individual de barra
function BarraEstadistica({
  opcion,
  barHeight,
  percentage,
  maxPercentage,
  barColor,
  barRadius,
  colorTexto,
  colorContorno,
  colorValor,
  colorValorAlt,
}: {
  opcion: OpcionConVotos
  percentage: number
  maxPercentage?: number
  barHeight: number
  barColor: string
  barRadius: number
  colorTexto: string
  colorContorno: string
  colorValor: string
  colorValorAlt: string
  className?: string
  children?: ReactNode
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  const scrambledText = useScrambleText(opcion.texto)

  const p = maxPercentage ? percentage / maxPercentage : percentage

  // Geometría: etiqueta (fila superior, ancho completo) | barra 0-FIN_BARRA debajo | valor X_VALOR+
  const barY = ALTO_ETIQUETA
  const maxBarWidth = FIN_BARRA

  // La caja del valor (%/manito) tiene alto propio (no atado a barHeight) y va centrada sobre la barra,
  // así no se clipea aunque barHeight sea chico.
  const altoValor = Math.max(barHeight, ALTO_MIN_VALOR)
  const yValor = barY + (barHeight - altoValor) / 2

  const targetWidth = p > 0 ? p * maxBarWidth : 0
  const percentage100s = percentage * 100

  // Ancho a renderizar: nunca menos que MIN_ANCHO_BARRA, así el slot se ve aunque haya 0 votos.
  const anchoBarra = Math.max(animatedWidth, MIN_ANCHO_BARRA)

  // Animación de la barra
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(targetWidth)
    }, 100) // Delay escalonado

    return () => clearTimeout(timer)
  }, [targetWidth])

  // Sacudón angular + bump de escala de la manito cuando entra un voto nuevo (los votos suben).
  // Exagerado para que no se pierda cuando la barra además cambia de orden. El número acompaña:
  // la mano arranca girando a la izquierda y "empuja" el número hacia allá.
  const manitoControls = useAnimationControls()
  const numeroControls = useAnimationControls()
  const porcentajeControls = useAnimationControls()
  const votosPrevios = useRef(opcion.votos)
  useEffect(() => {
    if (opcion.votos > votosPrevios.current) {
      manitoControls.start({
        rotate: [0, -32, 24, -14, 0],
        scale: [1, 1.45, 1],
        transition: {
          duration: 0.55,
          ease: 'easeOut',
          // El bump de tamaño arranca con un pelín de delay y es súbito y corto.
          scale: { duration: 0.32, delay: 0.06, times: [0, 0.28, 1], ease: 'easeOut' },
        },
      })
      numeroControls.start({
        x: [0, -10, 0], // rebote hacia la izquierda (empujado por la mano)
        scale: [1, 1.22, 1], // pequeño boost de escala
        transition: { duration: 0.5, ease: 'easeOut', times: [0, 0.3, 1] },
      })
      // Solo la rampa de scale para el porcentaje (misma que el bump de la mano).
      porcentajeControls.start({
        scale: [1, 1.25, 1],
        transition: { duration: 0.32, delay: 0.06, times: [0, 0.28, 1], ease: 'easeOut' },
      })
    }
    votosPrevios.current = opcion.votos
  }, [opcion.votos, manitoControls, numeroControls, porcentajeControls])

  return (
    <g>
      {/* Barra de progreso animada */}
      <rect
        x={4}
        y={barY}
        width={anchoBarra}
        height={barHeight}
        fill={barColor}
        rx={barRadius}
        stroke={colorContorno}
        strokeWidth={3}
        style={{
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'left center',
        }}
      />

      {/* Etiqueta del texto de la respuesta -- fila superior, ancho completo */}
      <foreignObject x={0} y={0} width={FIN_BARRA} height={ALTO_ETIQUETA}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
          <Outlined outlineColor={colorContorno} radius={2} className="block w-full px-1">
            <div
              style={{
                color: colorTexto,
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: 1.3,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
                width: '100%',
              }}
            >
              {scrambledText}
            </div>
          </Outlined>
        </div>
      </foreignObject>

      {/* Valor y porcentaje -- a la derecha de la barra (que siempre termina en FIN_BARRA) */}
      <foreignObject x={X_VALOR} y={yValor} width={ANCHO_VALOR} height={altoValor}>
        <div className="flex items-center gap-8 pr-1" style={{ width: '100%', height: '100%' }}>
          {/* Ancho fijo + alineado a derecha: la columna de votos arranca en la misma x en toda fila */}
          <Outlined outlineColor={colorValorAlt} radius={3} className="flex items-center gap-1 text-3xl font-bold ">
            <motion.span
              animate={porcentajeControls}
              className="w-14 shrink-0 text-right text-xl"
              style={{ color: colorValor, display: 'inline-block' }}
            >
              {percentage100s.toFixed(0)}%
            </motion.span>
          </Outlined>
          <Outlined
            outlineColor={colorValor}
            radius={3}
            className="flex -rotate-6 items-center gap-1 text-4xl font-bold "
          >
            <span className="flex items-center gap-1" style={{ color: colorValorAlt }}>
              <motion.span animate={numeroControls} style={{ display: 'inline-flex' }}>
                {opcion.votos}
              </motion.span>{' '}
              <motion.span
                animate={manitoControls}
                style={{ display: 'inline-flex', transformOrigin: 'bottom center' }}
              >
                <Icon icon={'pepicons-pop:hand-point'} />
              </motion.span>
            </span>
          </Outlined>
        </div>
      </foreignObject>
    </g>
  )
}
