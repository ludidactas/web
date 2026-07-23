'use client'

import { Plus, RotateCcw, X } from 'lucide-react'

import TrazoColor from '@/svg/dist/ui/trazoColor.svg'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  CAMPOS_OVERLAY,
  CONFIG_DEFAULTS,
  descripcionCampo,
  EstadisticaSvgConfig,
  PALETA_DEFAULT,
} from '@/components/salas/overlay/estadistica-svg-config'

interface PanelConfigOverlayProps {
  config: EstadisticaSvgConfig
  onChange: (config: EstadisticaSvgConfig) => void
}

/** Panel de configuración del visualizador. Autogenera los controles desde CAMPOS_OVERLAY. */
export function PanelConfigOverlay({ config, onChange }: PanelConfigOverlayProps) {
  const set = <K extends keyof EstadisticaSvgConfig>(key: K, valor: EstadisticaSvgConfig[K]) =>
    onChange({ ...config, [key]: valor })

  return (
    <div className="flex flex-col gap-3 text-slate-700">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Apariencia del visualizador</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex h-7 flex-row items-center gap-1 px-2 text-xs text-slate-500"
          onClick={() => onChange(CONFIG_DEFAULTS)}
        >
          <RotateCcw size={12} /> Restaurar
        </Button>
      </div>

      <Separator />

      {CAMPOS_OVERLAY.map((campo) => {
        const ayuda = descripcionCampo(campo.key)

        if (campo.tipo === 'numero') {
          const valor = config[campo.key] as number
          return (
            <div key={campo.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs" title={ayuda}>
                  {campo.label}
                </Label>
                <span className="tabular-nums text-xs text-slate-500">{valor}px</span>
              </div>
              <input
                type="range"
                min={campo.min}
                max={campo.max}
                value={valor}
                onChange={(e) => set(campo.key, Number(e.target.value))}
                className="w-full accent-[#6F41CB]"
              />
            </div>
          )
        }

        if (campo.tipo === 'color') {
          const valor = config[campo.key] as string
          return (
            <div key={campo.key} className="flex flex-col gap-1">
              <Label className="text-xs" title={ayuda}>
                {campo.label}
              </Label>
              <CampoColor valor={valor} onChange={(v) => set(campo.key, v)} />
            </div>
          )
        }

        // tipo === 'colores'
        const colores = config[campo.key] as string[]
        return (
          <div key={campo.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs" title={ayuda}>
                {campo.label}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex h-6 flex-row items-center gap-1 px-2 text-xs text-slate-500"
                onClick={() => set(campo.key, [...colores, PALETA_DEFAULT[colores.length % PALETA_DEFAULT.length]])}
              >
                <Plus size={12} /> Agregar
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              {colores.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CampoColor
                    valor={c}
                    onChange={(v) => set(campo.key, colores.map((x, j) => (j === i ? v : x)))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500"
                    disabled={colores.length <= 1}
                    onClick={() => set(campo.key, colores.filter((_, j) => j !== i))}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Input de color: swatch con forma de trazo tinteado (abre el picker nativo) + campo de texto. */
function CampoColor({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <label className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center" title="Elegir color">
        {/* El trazo se pinta con el color exacto; el drop-shadow lo hace visible aun si es claro/blanco. */}
        <TrazoColor
          className="h-6 w-6"
          fill={valor}
          style={{ fillRule: 'evenodd', clipRule: 'evenodd', filter: 'drop-shadow(0 0 0.5px rgba(0,0,0,0.45))' }}
        />
        <input
          type="color"
          aria-label="Elegir color"
          value={cssColorAHex(valor)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 rounded-md border border-input px-2 py-1 text-xs"
        spellCheck={false}
      />
    </div>
  )
}

// Nombres CSS más comunes (los que aparecen en los defaults + básicos) para que el picker los matchee.
const COLORES_NOMBRADOS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  gray: '#808080',
  grey: '#808080',
}

/**
 * Resuelve cualquier color CSS (hex, rgb/rgba, nombre) al hex #rrggbb que necesita el <input type=color>,
 * así el swatch matchea lo que se ve en el overlay. El alpha se ignora (el picker no lo soporta).
 * Parser puro (sin DOM) para que SSR y cliente coincidan y no haya mismatch de hidratación.
 */
function cssColorAHex(color: string): string {
  const c = color.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(c)) return c
  if (/^#[0-9a-f]{3}$/.test(c))
    return '#' + [...c.slice(1)].map((x) => x + x).join('')
  const rgb = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/)
  if (rgb) {
    const hex = rgb
      .slice(1, 4)
      .map((n) => Math.max(0, Math.min(255, Math.round(parseFloat(n)))).toString(16).padStart(2, '0'))
      .join('')
    return '#' + hex
  }
  return COLORES_NOMBRADOS[c] ?? '#000000'
}
