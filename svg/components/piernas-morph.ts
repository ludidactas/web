import { G, Svg } from '@svgdotjs/svg.js'

/**
 * Piernas que caminan transformándose una en otra: se toman dos capas del export como las dos
 * poses de una misma pierna (atrás, curvada; adelante, estirada) y se generan dos piernas nuevas
 * que interpolan continuamente entre ambas poses, en contrafase. Así una pasa adelante mientras
 * la otra pasa atrás, curvándose la estirada y estirándose la curvada, como en una caminata.
 *
 * Cada capa tiene que tener esta estructura (la que sale de Affinity):
 *
 *     <g capa>
 *       <g pierna>  relleno, clipPath + sombra, trazo (el mismo contorno)
 *       <g zapato>
 */

type Punto = [number, number]

/** Cantidad de puntos con que se muestrean los contornos para poder interpolarlos */
const MUESTRAS = 240

const ctm = (e: Element) => (e as SVGGraphicsElement).getScreenCTM()!

/** Puntos del contorno de `path`, en las coordenadas de `espacio` */
function muestrear(path: SVGGeometryElement, espacio: Element): Punto[] {
  const m = ctm(espacio).inverse().multiply(ctm(path))
  const largo = path.getTotalLength()
  return Array.from({ length: MUESTRAS }, (_, i) => {
    const p = path.getPointAtLength((largo * i) / MUESTRAS).matrixTransform(m)
    return [p.x, p.y] as Punto
  })
}

/**
 * Para que dos contornos se correspondan punto a punto: mismo sentido de giro, y arrancando
 * desde el punto más alto (la cadera)
 */
function alinear(puntos: Punto[], arriba: Punto): Punto[] {
  const area = puntos.reduce((suma, [x1, y1], i) => {
    const [x2, y2] = puntos[(i + 1) % puntos.length]
    return suma + x1 * y2 - x2 * y1
  }, 0)
  const ordenados = area < 0 ? [...puntos].reverse() : puntos
  const altura = ([x, y]: Punto) => x * arriba[0] + y * arriba[1]
  const inicio = ordenados.reduce((mejor, p, i) => (altura(p) > altura(ordenados[mejor]) ? i : mejor), 0)
  return [...ordenados.slice(inicio), ...ordenados.slice(0, inicio)]
}

const aPath = (puntos: Punto[]) => `M${puntos.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`

const escalaDe = (m: DOMMatrix) => Math.sqrt(Math.abs(m.a * m.d - m.b * m.c))

interface Pose {
  contorno: Punto[]
  sombra: Punto[]
  /** Por punto: 0 en la cadera, 1 en el pie. Para levantar el pie sin mover la cadera */
  peso: number[]
  pesoSombra: number[]
  zapato: { el: G; base: string; ancla: number }
  relleno: string
  colorSombra: string
  trazo: { color: string; ancho: number }
}

function leerPose(capa: G, espacio: Element, arriba: Punto): Pose {
  const [pierna, zapato] = capa.children() as unknown as G[]
  const paths = pierna.node.querySelectorAll<SVGGeometryElement>(':scope > path')
  const [rellenoPath, trazoPath] = [paths[0], paths[paths.length - 1]]
  const sombraPath = pierna.node.querySelector<SVGGeometryElement>('[clip-path] path')!

  const largo = Math.hypot(...arriba)
  const unitario: Punto = [arriba[0] / largo, arriba[1] / largo]
  const contorno = alinear(muestrear(rellenoPath, espacio), unitario)
  const sombra = alinear(muestrear(sombraPath, espacio), unitario)

  const altura = ([x, y]: Punto) => x * unitario[0] + y * unitario[1]
  const alturas = contorno.map(altura)
  const [cadera, pie] = [Math.max(...alturas), Math.min(...alturas)]
  const pesar = (p: Punto) => Math.min(1, Math.max(0, (cadera - altura(p)) / (cadera - pie)))

  // El zapato se engancha al punto del contorno más cercano a su centro
  const caja = zapato.node.getBoundingClientRect()
  const centro = new DOMPoint(caja.x + caja.width / 2, caja.y + caja.height / 2).matrixTransform(ctm(espacio).inverse())
  const ancla = contorno.reduce(
    (mejor, [x, y], i) =>
      Math.hypot(x - centro.x, y - centro.y) < Math.hypot(contorno[mejor][0] - centro.x, contorno[mejor][1] - centro.y)
        ? i
        : mejor,
    0
  )
  const { a, b, c, d, e, f } = ctm(espacio).inverse().multiply(ctm(capa.node))

  const estilo = getComputedStyle(trazoPath)
  return {
    contorno,
    sombra,
    peso: contorno.map(pesar),
    pesoSombra: sombra.map(pesar),
    zapato: { el: zapato, base: `matrix(${a},${b},${c},${d},${e},${f})`, ancla },
    relleno: getComputedStyle(rellenoPath).fill,
    colorSombra: getComputedStyle(sombraPath).fill,
    trazo: {
      color: estilo.stroke,
      ancho: parseFloat(estilo.strokeWidth) * escalaDe(ctm(espacio).inverse().multiply(ctm(trazoPath))),
    },
  }
}

const mezclar = (a: number, b: number, s: number) => a + (b - a) * s
const mezclarPuntos = (a: Punto[], b: Punto[], s: number): Punto[] =>
  a.map(([x, y], i) => [mezclar(x, b[i][0], s), mezclar(y, b[i][1], s)])

function tangente(puntos: Punto[], i: number) {
  const n = puntos.length
  const [x1, y1] = puntos[(i - 4 + n) % n]
  const [x2, y2] = puntos[(i + 4) % n]
  return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
}

/**
 * Arma las dos piernas animables y oculta las capas originales. Devuelve la función que las
 * actualiza en cada cuadro.
 *
 * - `fasePaso`: ángulo del ciclo (0 = la primera pierna atrás, π = adelante)
 * - `levantar`: cuánto se levanta el pie que avanza, en unidades del viewBox
 * - `subida`: cuánto subió el cuerpo por el rebote, en unidades del viewBox (se compensa para
 *   que el pie apoyado no despegue del piso)
 */
export function prepararPiernasMorph(root: Svg, atras: G, adelante: G, id: string) {
  const espacio = atras.parent() as G
  // Vector de 1 unidad del viewBox hacia arriba, en coordenadas de `espacio`
  const m = ctm(espacio.node).inverse().multiply(ctm(root.node))
  const arriba: Punto = [-m.c, -m.d]

  const poses = [leerPose(atras, espacio.node, arriba), leerPose(adelante, espacio.node, arriba)] as const

  // Se generan detrás de la capa de atrás, para mantener el orden de dibujo original
  const piernas = [0, 1].map((n) => {
    const g = new G().addClass('pierna-morph')
    atras.before(g)
    const clip = g.clip().attr({ id: `${id}-pierna${n}` })
    const contornoClip = clip.path()
    const relleno = g.path().attr({ style: `fill:${poses[0].relleno}` })
    const sombra = g
      .group()
      .clipWith(clip)
      .path()
      .attr({ style: `fill:${poses[0].colorSombra}` })
    const trazo = g.path().attr({
      style: `fill:none;stroke:${poses[0].trazo.color};stroke-width:${poses[0].trazo.ancho};stroke-linejoin:round`,
    })
    // Un zapato por pose, cada uno en su lugar original; se muestra el de la pose más cercana
    const zapatos = poses.map((pose) => {
      const z = g.group()
      z.group().attr({ transform: pose.zapato.base }).add(pose.zapato.el.clone())
      return z
    })
    return { contornoClip, relleno, sombra, trazo, zapatos }
  })

  atras.hide()
  adelante.hide()

  return (fasePaso: number, levantar: number, subida: number) => {
    // La primera pierna va de atrás (s = 0) a adelante (s = 1) y vuelve; la segunda al revés
    const s = (1 - Math.cos(fasePaso)) / 2
    const estados = [
      { s, alto: Math.max(0, Math.sin(fasePaso)) * levantar },
      { s: 1 - s, alto: Math.max(0, -Math.sin(fasePaso)) * levantar },
    ]

    piernas.forEach((pierna, n) => {
      const { s, alto } = estados[n]
      // Desplazamiento hacia arriba, nulo en la cadera y completo en el pie
      const desplazar = (puntos: Punto[], pesoA: number[], pesoB: number[]): Punto[] =>
        puntos.map(([x, y], i) => {
          const d = (alto - subida) * mezclar(pesoA[i], pesoB[i], s)
          return [x + arriba[0] * d, y + arriba[1] * d]
        })

      const contorno = desplazar(mezclarPuntos(poses[0].contorno, poses[1].contorno, s), poses[0].peso, poses[1].peso)
      const sombra = desplazar(mezclarPuntos(poses[0].sombra, poses[1].sombra, s), poses[0].pesoSombra, poses[1].pesoSombra)
      const d = aPath(contorno)
      pierna.contornoClip.plot(d)
      pierna.relleno.plot(d)
      pierna.trazo.plot(d)
      pierna.sombra.plot(aPath(sombra))

      // Cada zapato sigue a su punto de enganche, rotando con la punta de la pierna
      poses.forEach((pose, k) => {
        const i = pose.zapato.ancla
        const [x0, y0] = pose.contorno[i]
        const [x, y] = contorno[i]
        const giro = tangente(contorno, i) - tangente(pose.contorno, i)
        pierna.zapatos[k]
          .attr({ transform: `translate(${x} ${y}) rotate(${giro}) translate(${-x0} ${-y0})` })
          .css({ display: (s < 0.5) === (k === 0) ? 'inline' : 'none' })
      })
    })
  }
}
