import { z } from 'zod'

// Paleta por defecto de las barras: se recorre en orden y cicla si hay más opciones que colores.
export const PALETA_DEFAULT = [
  'rgb(59, 130, 246)', // blue-500
  'rgb(16, 185, 129)', // emerald-500
  'rgb(168, 85, 247)', // purple-500
  'rgb(245, 101, 101)', // red-400
  'rgb(251, 191, 36)', // amber-400
  'rgb(14, 165, 233)', // sky-500
  'rgb(236, 72, 153)', // pink-500
  'rgb(34, 197, 94)', // green-500
]

// ────────────────────────────────────────────────────────────────────────────
// Helpers para leer config desde query params. Todo llega como string (o array si
// el param se repite), así que coercionamos. Usamos `.catch(default)` en vez de
// `.optional().default()` para que un valor faltante O inválido caiga al default
// sin romper: el overlay va sobre un stream y nunca debe quedar en pantalla de error.
// ────────────────────────────────────────────────────────────────────────────

// Número desde string ("60" → 60), con rango opcional; cae al default si falta, no es
// finito, o queda fuera de [min, max].
const numero = (def: number, min?: number, max?: number) => {
  let schema = z.coerce.number().finite()
  if (min !== undefined) schema = schema.min(min)
  if (max !== undefined) schema = schema.max(max)
  return schema.catch(def)
}

// Color como string libre (rgb/rgba/hex/nombre); default si falta.
const color = (def: string) => z.string().min(1).catch(def)

// Lista de colores: acepta "a,b,c" (separado por comas) o el param repetido (?colores=a&colores=b).
const listaColores = (def: string[]) =>
  z
    .preprocess(
      (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()) : v),
      z.array(z.string().min(1)).min(1)
    )
    .catch(def)

// Validación de query params. Cada `.describe()` documenta el parámetro (lo usará el panel de config).
export const estadisticaSvgConfigValidator = z.object({
  fondo: color('rgba(0, 0, 0, 0.4)').describe('Color de fondo del recuadro (hex, rgb/rgba o nombre CSS).'),
  radioFondo: numero(12, 0, 50).describe('Radio de las esquinas del recuadro de fondo, en px (0–50).'),
  altoBarra: numero(40, 8, 200).describe('Alto de cada barra, en px (8–200).'),
  espacioBarras: numero(20, 0, 300).describe('Espacio (gap) vertical entre barras, en px (0–300).'),
  margen: numero(12, 0, 50).describe(
    'Padding interno del recuadro (espacio entre el borde y las barras), en px (0–50).'
  ),
  radioBarra: numero(8, 0, 25).describe('Radio de las esquinas de las barras, en px (0–25).'),
  colorTexto: color('rgb(255, 255, 255)').describe('Color del texto de la pregunta y de las etiquetas de respuesta.'),
  colorContorno: color('rgba(0, 0, 0, 0)').describe('Color del contorno del título, las opciones y las barras.'),
  colores: listaColores(PALETA_DEFAULT).describe(
    'Paleta de las barras (lista separada por comas); cicla si hay más opciones que colores.'
  ),
  // Par de colores del bloque de valor (%/votos); se usan invertidos entre sí para dar contraste.
  colorValor: color('rgb(255, 255, 255)').describe('Color del texto del % y del contorno de los votos.'),
  colorValorAlterno: color('rgb(0, 0, 0)').describe('Color del contorno del % y del relleno de los votos.'),
})

export type EstadisticaSvgConfig = z.infer<typeof estadisticaSvgConfigValidator>

// Config por defecto (lo que ve el overlay sin ningún query param).
export const CONFIG_DEFAULTS: EstadisticaSvgConfig = estadisticaSvgConfigValidator.parse({})

// ────────────────────────────────────────────────────────────────────────────
// Metadata para el panel de configuración: describe qué control renderizar por campo.
// El texto de ayuda sale del `.describe()` del schema (fuente única de verdad).
// Nota: los rangos deben coincidir con los del validator de arriba.
// ────────────────────────────────────────────────────────────────────────────
export type CampoOverlay =
  | { key: keyof EstadisticaSvgConfig; label: string; tipo: 'numero'; min: number; max: number }
  | { key: keyof EstadisticaSvgConfig; label: string; tipo: 'color' }
  | { key: keyof EstadisticaSvgConfig; label: string; tipo: 'colores' }

export const CAMPOS_OVERLAY: CampoOverlay[] = [
  { key: 'altoBarra', label: 'Alto de barra', tipo: 'numero', min: 8, max: 200 },
  { key: 'espacioBarras', label: 'Espacio entre barras', tipo: 'numero', min: 0, max: 300 },
  { key: 'radioBarra', label: 'Redondeo de barras', tipo: 'numero', min: 0, max: 25 },
  { key: 'margen', label: 'Margen interno', tipo: 'numero', min: 0, max: 50 },
  { key: 'fondo', label: 'Fondo', tipo: 'color' },
  { key: 'radioFondo', label: 'Redondeo del fondo', tipo: 'numero', min: 0, max: 50 },
  { key: 'colorTexto', label: 'Color de texto', tipo: 'color' },
  { key: 'colorContorno', label: 'Color de contorno', tipo: 'color' },
  { key: 'colorValor', label: 'Color de valores', tipo: 'color' },
  { key: 'colorValorAlterno', label: 'Color alterno de valores', tipo: 'color' },
  { key: 'colores', label: 'Paleta de barras', tipo: 'colores' },
]

/** Descripción (ayuda) de un campo, tomada del `.describe()` del schema. */
export const descripcionCampo = (key: keyof EstadisticaSvgConfig): string | undefined =>
  estadisticaSvgConfigValidator.shape[key].description

/**
 * Arma la URL del overlay con los params que difieren del default (los defaults se omiten para
 * mantener el link corto). `URLSearchParams` encodea solo; `colores` va como params repetidos para
 * que los `rgb(...)` con comas no se partan.
 */
export function construirUrlOverlay(base: string, config: EstadisticaSvgConfig): string {
  const params = new URLSearchParams()
  for (const { key } of CAMPOS_OVERLAY) {
    const valor = config[key]
    if (JSON.stringify(valor) === JSON.stringify(CONFIG_DEFAULTS[key])) continue // omitir defaults
    if (Array.isArray(valor)) valor.forEach((v) => params.append(key, String(v)))
    else params.set(key, String(valor))
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}
