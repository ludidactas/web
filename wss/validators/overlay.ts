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
  z.preprocess((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()) : v), z.array(z.string().min(1)).min(1)).catch(def)

// Validación de la config del overlay. Cada `.describe()` documenta el parámetro (lo usa el panel de config).
// Vive en wss/ para ser fuente única de verdad entre el FE (panel + render) y el server (persistencia en la sala).
export const estadisticaSvgConfigValidator = z.object({
  fondo: color('rgba(0, 0, 0, 0.4)').describe('Color de fondo del recuadro (hex, rgb/rgba o nombre CSS).'),
  radioFondo: numero(12, 0, 50).describe('Radio de las esquinas del recuadro de fondo, en px (0–50).'),
  altoBarra: numero(40, 8, 200).describe('Alto de cada barra, en px (8–200).'),
  espacioBarras: numero(20, 0, 300).describe('Espacio (gap) vertical entre barras, en px (0–300).'),
  margen: numero(12, 0, 50).describe('Padding interno del recuadro (espacio entre el borde y las barras), en px (0–50).'),
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

// Config por defecto (lo que ve el overlay sin ningún query param ni override guardado).
export const CONFIG_DEFAULTS: EstadisticaSvgConfig = estadisticaSvgConfigValidator.parse({})
