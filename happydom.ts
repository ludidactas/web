import { GlobalRegistrator } from '@happy-dom/global-registrator'

// El `fetch` de happy-dom aplica la política de mismo origen y bloquea cualquier URL externa; los
// tests que bajan contenido de la red (ej. los desafíos del dojo) necesitan el `fetch` nativo de Bun.
const fetchNativo = globalThis.fetch
GlobalRegistrator.register()
globalThis.fetch = fetchNativo

// happy-dom no implementa `SVGPoint.prototype.matrixTransform` (usado por
// `usePuntoDesdeEventoSvg` en src/lib/go/tablero-go-base.tsx para la matemática de click del
// tablero) — se lo agregamos acá, con la fórmula estándar de la spec de SVG, para poder testear
// componentes que dependen de eso bajo happy-dom.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SVGPoint = (globalThis as any).SVGPoint
SVGPoint.prototype.matrixTransform = function (this: { x: number; y: number }, m: DOMMatrix) {
  return {
    x: this.x * m.a + this.y * m.c + m.e,
    y: this.x * m.b + this.y * m.d + m.f,
  }
}
