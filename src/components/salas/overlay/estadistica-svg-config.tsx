import { CONFIG_DEFAULTS, estadisticaSvgConfigValidator, PALETA_DEFAULT, type EstadisticaSvgConfig } from '@/wss/validators/overlay'

// La schema + defaults viven en wss/ (compartidos con el server, que persiste la config en la sala).
// Re-exportamos desde acá para que el resto del FE los siga importando por esta ruta.
export { CONFIG_DEFAULTS, estadisticaSvgConfigValidator, PALETA_DEFAULT }
export type { EstadisticaSvgConfig }

// ────────────────────────────────────────────────────────────────────────────
// Metadata para el panel de configuración: describe qué control renderizar por campo.
// El texto de ayuda sale del `.describe()` del schema (fuente única de verdad).
// Nota: los rangos deben coincidir con los del validator.
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
