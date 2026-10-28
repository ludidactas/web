'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import { Element as SvgElement, G, Svg } from '@svgdotjs/svg.js'
import { useId } from 'react'
import { prepararPiernasMorph } from './piernas-morph'

/**
 * Capa que se balancea como péndulo desde su punto más alto (cadera / hombro), o el más bajo
 * para un brazo levantado. `fase` en medias vueltas (0 o 1 para ir en contrafase), `escala` es
 * la fracción de la amplitud.
 *
 * Con `pierna`, además de balancearse da pasos: se balancea alrededor de la vertical (aunque esté
 * dibujada en plena zancada), se levanta mientras va hacia adelante y, si se indica `zapato` (el
 * índice del grupo hijo de la capa que es el zapato), apoya el talón y despega con la punta.
 */
export interface Pendulo {
  id: string
  fase: number
  escala: number
  pivote?: 'arriba' | 'abajo'
  pierna?: boolean
  zapato?: number
}

/**
 * Ojos para el parpadeo. Con `cerrados`, se alterna entre las dos capas; sin ella, los ojos
 * abiertos se aplastan verticalmente un instante.
 */
export interface Ojos {
  abiertos: string
  cerrados?: string
}

export interface PersonajeCaminanteProps {
  className?: string
  /** Duración de un paso completo (ida y vuelta de una pierna), en ms */
  paso?: number
  /** Amplitud del balanceo de las piernas, en grados (las manos usan una fracción) */
  amplitud?: number
  /** Cuánto se levanta el pie al dar el paso (en px, viendo el personaje a 300px de ancho) */
  levantar?: number
  /** Cuánto sube y baja el cuerpo en cada paso (en px, viendo el personaje a 300px de ancho) */
  rebote?: number
  /** Inclinación del zapato al apoyar el talón y despegar la punta, en grados */
  pisada?: number
  /** Cada cuánto parpadea, en ms */
  parpadeo?: number
  /** Cuánto dura el ojo cerrado, en ms */
  cerrado?: number
  /** Color de la mancha sketchy de fondo, o `false` para no mostrarla */
  mancha?: string | false
}

/**
 * Piernas que caminan transformándose una en otra (ver `piernas-morph.ts`): ids de las capas con
 * la pose de atrás (curvada) y la de adelante (estirada)
 */
export interface PiernasMorph {
  atras: string
  adelante: string
}

interface Props extends PersonajeCaminanteProps {
  /** Componente importado (vía svgr) del `.svg` */
  SvgComponent: any
  pendulos: readonly Pendulo[]
  piernas?: PiernasMorph
  ojos: Ojos
}

/**
 * Las capas ya traen un `transform` del export, así que las envolvemos en un
 * grupo interno y transformamos ese, para no pisar el original
 */
function envolver(capa: G, clase: string) {
  let g = capa.findOne(`.${clase}`) as G | null
  if (!g) {
    g = capa.group().addClass(clase)
    capa.children().forEach((hijo) => hijo !== g && g!.add(hijo))
  }
  return g
}

const ctm = (e: SvgElement) => (e.node as SVGGraphicsElement).getScreenCTM()!

/**
 * Punto más alto (o más bajo) del dibujo de `capa`, en pantalla.
 * Para una pierna en diagonal, la cadera está ahí y no en el centro del recuadro.
 */
function extremoEnPantalla(capa: SvgElement, lado: 'arriba' | 'abajo') {
  const puntos: DOMPoint[] = []
  capa.node.querySelectorAll<SVGGeometryElement>('path, ellipse, circle, rect, polygon, polyline, line').forEach((geo) => {
    if (geo.closest('clipPath')) return
    const m = geo.getScreenCTM()!
    const largo = geo.getTotalLength()
    for (let i = 0; i <= 60; i++) puntos.push(geo.getPointAtLength((largo * i) / 60).matrixTransform(m))
  })
  const ys = puntos.map((p) => p.y)
  const objetivo = lado === 'arriba' ? Math.min(...ys) : Math.max(...ys)
  // Promediamos los puntos cercanos al extremo, por si el borde es plano
  const tolerancia = (Math.max(...ys) - Math.min(...ys)) * 0.05
  const cerca = puntos.filter((p) => Math.abs(p.y - objetivo) <= tolerancia)
  const x = cerca.reduce((suma, p) => suma + p.x, 0) / cerca.length
  return new DOMPoint(x, objetivo)
}

/** `extremoEnPantalla`, expresado en las coordenadas de `espacio` */
function extremo(capa: SvgElement, espacio: SvgElement, lado: 'arriba' | 'abajo'): [number, number] {
  const local = extremoEnPantalla(capa, lado).matrixTransform(ctm(espacio).inverse())
  return [local.x, local.y]
}

/**
 * Ángulo (en grados, horario) que hay que rotar la capa para que quede vertical, de su punto más
 * alto al más bajo. Para una pierna dibujada en plena zancada
 */
function aVertical(capa: SvgElement) {
  const arriba = extremoEnPantalla(capa, 'arriba')
  const abajo = extremoEnPantalla(capa, 'abajo')
  return (Math.atan2(abajo.x - arriba.x, abajo.y - arriba.y) * 180) / Math.PI
}

/** Vector "hacia arriba" de 1 unidad del viewBox, expresado en las coordenadas de `espacio` */
function arribaEn(root: Svg, espacio: SvgElement): [number, number] {
  const m = ctm(espacio).inverse().multiply(ctm(root))
  return [-m.c, -m.d]
}

/**
 * Lo que se calcula una sola vez, con el personaje en reposo (si se calculara en cada setup, el
 * personaje ya podría estar en medio de un paso)
 */
interface Medidas {
  /** Unidades del viewBox que equivalen a 1px viendo el personaje a 300px de ancho */
  u: number
  cuerpo: { g: G; arriba: [number, number] }
  pendulos: Map<
    string,
    { pivote: [number, number]; arriba: [number, number]; reposo: number; zapato?: { g: G; tobillo: [number, number] } }
  >
  piernas?: ReturnType<typeof prepararPiernasMorph>
}
/**
 * Se guardan en el propio nodo del svg (y no en una variable del módulo) para que sobrevivan a la
 * recarga en caliente de Next: si no, se volverían a calcular sobre un svg ya modificado (piernas
 * originales ocultas, piernas generadas duplicadas)
 */
const medidas = {
  get: (nodo: Element) => (nodo as Element & { __medidas?: Medidas }).__medidas,
  set: (nodo: Element, m: Medidas) => ((nodo as Element & { __medidas?: Medidas }).__medidas = m),
}

function medir(
  root: Svg,
  nodos: Record<string, SvgElement>,
  pendulos: readonly Pendulo[],
  piernas: PiernasMorph | undefined,
  id: string
): Medidas {
  const guardadas = medidas.get(root.node)
  if (guardadas) return guardadas

  // El rebote se aplica a todo el dibujo (el primer grupo del svg)
  const todo = root.findOne(':scope > g') as G
  const nuevas: Medidas = {
    u: root.viewbox().width / 300,
    cuerpo: { g: envolver(todo, 'rebote'), arriba: arribaEn(root, todo) },
    pendulos: new Map(),
  }
  pendulos.forEach(({ id, pivote = 'arriba', pierna, zapato }) => {
    const capa = nodos[id] as G
    const g = envolver(capa, 'pendulo')
    const z = zapato !== undefined ? (g.children()[zapato] as G) : undefined
    nuevas.pendulos.set(id, {
      pivote: extremo(capa, capa, pivote),
      arriba: arribaEn(root, capa),
      reposo: pierna ? aVertical(capa) : 0,
      zapato: z && { g: z, tobillo: extremo(z, g, 'arriba') },
    })
  })
  if (piernas) {
    nuevas.piernas = prepararPiernasMorph(root, nodos[piernas.atras] as G, nodos[piernas.adelante] as G, id)
  }
  medidas.set(root.node, nuevas)
  return nuevas
}

/**
 * Agrega detrás de todo una mancha generada a partir de la silueta del personaje: se engorda
 * (feMorphology) y pasa por dos deformaciones de ruido, una grande y lenta (la forma va cambiando)
 * y una fina y rápida (borde sketchy, como `#sketchy` de `FiltrosSvg`). Como usa un `<use>` del
 * personaje, acompaña el movimiento de piernas y manos. Todo se mide en unidades del viewBox, así
 * se ve proporcional en cualquier tamaño.
 */
function agregarMancha(root: Svg, id: string, color: string) {
  const vb = root.viewbox()
  // Unidades del viewBox que equivalen a 1px cuando el personaje se ve a 300px de ancho
  const u = vb.width / 300

  // Cuánto sobresale la mancha alrededor del personaje
  const contorno = 2 * u
  const forma = { desplazamiento: 4 * u, frecuencia: 0.008 / u, dur: '1.2s' }
  const borde = { desplazamiento: 7 * u, frecuencia: 0.06 / u, dur: '0.36s' }

  // El export viene recortado justo al personaje: agrandamos el viewBox para que entre la mancha,
  // con margen para que la deformación no quede recortada
  const margen = contorno + (forma.desplazamiento + borde.desplazamiento) / 2
  const region = { x: vb.x - margen, y: vb.y - margen, width: vb.width + 2 * margen, height: vb.height + 2 * margen }
  root.viewbox(region.x, region.y, region.width, region.height)

  root.defs().svg(`
    <filter id="${id}" filterUnits="userSpaceOnUse" x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}">
      <feMorphology in="SourceAlpha" operator="dilate" radius="${contorno}" result="silueta" />
      <feTurbulence type="fractalNoise" baseFrequency="${forma.frecuencia}" numOctaves="1" seed="1" result="ruidoForma">
        <animate attributeName="seed" values="1;2;3;4" dur="${forma.dur}" calcMode="discrete" repeatCount="indefinite" />
      </feTurbulence>
      <feDisplacementMap in="silueta" in2="ruidoForma" scale="${forma.desplazamiento}" xChannelSelector="R" yChannelSelector="G" result="forma" />
      <feTurbulence type="fractalNoise" baseFrequency="${borde.frecuencia}" numOctaves="3" seed="1" result="ruidoBorde">
        <animate attributeName="seed" values="1;2;3" dur="${borde.dur}" calcMode="discrete" repeatCount="indefinite" />
      </feTurbulence>
      <feDisplacementMap in="forma" in2="ruidoBorde" scale="${borde.desplazamiento}" xChannelSelector="R" yChannelSelector="G" result="deformada" />
      <!-- Umbral: el desplazamiento deja el borde difuso, lo volvemos nítido -->
      <feComponentTransfer in="deformada" result="mancha">
        <feFuncA type="discrete" tableValues="0 1" />
      </feComponentTransfer>
      <feFlood flood-color="${color}" />
      <feComposite in2="mancha" operator="in" />
    </filter>
  `)

  // El dibujo entero es el primer grupo del svg. Id único para el `<use>`, por si hay varios
  // personajes en la misma página
  const personaje = root.findOne(':scope > g') as SvgElement
  personaje.attr({ id: `${id}-personaje` })

  // El `<use>` no hereda los transforms de los grupos padre: le aplicamos el mismo pasaje de
  // coordenadas. Va dentro de un grupo sin transform, así el filtro mide en unidades del viewBox
  const { a, b, c, d, e, f } = ctm(root).inverse().multiply(ctm(personaje.parent() as SvgElement))
  const mancha = root.group().attr({ filter: `url(#${id})` }).addClass('mancha')
  mancha.use(personaje).attr({ transform: `matrix(${a},${b},${c},${d},${e},${f})` })
  // Al fondo, detrás del personaje
  root.first().before(mancha)
}

/**
 * Personaje que camina: da pasos (balanceo desde la cadera, levanta el pie al avanzar, apoya
 * talón y despega punta, el cuerpo rebota), balancea las manos, parpadea, y opcionalmente tiene
 * una mancha sketchy de fondo que lo contornea
 */
export function PersonajeCaminante({
  SvgComponent,
  pendulos,
  piernas,
  ojos,
  className,
  paso = 1600,
  amplitud = 12,
  levantar = 8,
  rebote = 3,
  pisada = 15,
  parpadeo = 3500,
  cerrado = 250,
  mancha = 'black',
}: Props) {
  const filtroId = `mancha-${useId().replace(/:/g, '')}`
  const idsOjos = ojos.cerrados ? [ojos.abiertos, ojos.cerrados] : [ojos.abiertos]

  return (
    <LdSvg
      className={className}
      SvgComponent={SvgComponent}
      ids={[...pendulos.map(({ id }) => id), ...(piernas ? [piernas.atras, piernas.adelante] : []), ...idsOjos]}
      setup={(nodos) => {
        const root = nodos[ojos.abiertos].root()
        // Antes de la mancha, que agranda el viewBox
        medir(root, nodos, pendulos, piernas, filtroId)
        // El export viene recortado justo al personaje: que lo que se balancea no quede cortado
        root.css({ overflow: 'visible' })
        if (mancha && !document.getElementById(filtroId)) agregarMancha(root, filtroId, mancha)
      }}
      animation={(nodos, t) => {
        const m = medidas.get(nodos[ojos.abiertos].root().node)
        if (!m) return
        const fasePaso = (2 * Math.PI * t) / paso

        // Rebote: el cuerpo baja al apoyar el pie y sube cuando las piernas se cruzan (con las
        // piernas morph se cruzan en sin = ±1, con los péndulos en cos = ±1)
        const subida = Math.abs(m.piernas ? Math.sin(fasePaso) : Math.cos(fasePaso)) * rebote * m.u
        m.cuerpo.g.transform({ translate: [m.cuerpo.arriba[0] * subida, m.cuerpo.arriba[1] * subida] })
        m.piernas?.(fasePaso, levantar * m.u, subida)

        pendulos.forEach(({ id, fase, escala, pierna }) => {
          const { pivote, arriba, reposo, zapato } = m.pendulos.get(id)!
          const φ = fasePaso + fase * Math.PI
          // Adelante (sin φ = 1) es hacia la derecha: rotación antihoraria
          const angulo = reposo - Math.sin(φ) * amplitud * escala
          // El pie se levanta solo mientras avanza (cos φ > 0); apoyado, se arrastra hacia atrás
          const alto = pierna ? Math.max(0, Math.cos(φ)) * levantar * m.u : 0
          envolver(nodos[id] as G, 'pendulo').transform({
            rotate: angulo,
            origin: pivote,
            translate: [arriba[0] * alto, arriba[1] * alto],
          })
          // Talón al apoyar adelante (punta arriba), punta al despegar atrás (talón arriba)
          zapato?.g.transform({ rotate: -Math.sin(φ) * pisada, origin: zapato.tobillo })
        })

        // Parpadeo: ojos abiertos casi todo el tiempo, cerrados un instante
        const parpadeando = t % parpadeo > parpadeo - cerrado
        if (ojos.cerrados) {
          nodos[ojos.abiertos].attr({ opacity: parpadeando ? 0 : 1 })
          nodos[ojos.cerrados].attr({ opacity: parpadeando ? 1 : 0 })
        } else {
          const g = envolver(nodos[ojos.abiertos] as G, 'parpado')
          const { cx, cy } = g.bbox()
          g.transform({ scale: [1, parpadeando ? 0.1 : 1], origin: [cx, cy] })
        }
      }}
    />
  )
}
