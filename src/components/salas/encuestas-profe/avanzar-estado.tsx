'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { Encuesta } from '@/wss/validators/polls'
import { StepForward } from 'lucide-react'

export type EstadoEncuesta =
  | 'oculta'
  | 'archivada'
  | 'cerrada'
  | 'abierta'
  | 'pausada'
  | 'enfocada'
  | 'revelada'
  | 'participada'
  | 'concluida'

type FlagsEncuesta = Pick<Encuesta, 'isPublished' | 'isOpen' | 'isFocused' | 'isRevealed'>

/**
 * Deriva un solo estado a partir de las 4 flags independientes de una encuesta.
 * `isOpen` no distingue a 'revelada': una vez enfocada y revelada, que siga abierta o no
 * es un detalle secundario (típicamente se cierra antes o al mismo tiempo que se revela).
 */
export function estadoEncuesta(encuesta: FlagsEncuesta): EstadoEncuesta {
  const { isPublished, isOpen, isFocused, isRevealed } = encuesta

  if (!isPublished) return isRevealed ? 'archivada' : 'oculta'
  if (isFocused) return isRevealed ? 'revelada' : isOpen ? 'enfocada' : 'pausada'
  if (isRevealed) return isOpen ? 'participada' : 'concluida'
  return isOpen ? 'abierta' : 'cerrada'
}

export const ESTADOS_ENCUESTA: Record<EstadoEncuesta, { label: string; className: string; descripcion: string }> = {
  oculta: {
    label: 'Oculta',
    className: 'text-slate-500',
    descripcion: 'Los estudiantes todavía no la ven',
  },
  archivada: {
    label: 'Archivada',
    className: 'text-slate-400',
    descripcion: 'Ya se usó y se volvió a esconder',
  },
  cerrada: {
    label: 'Cerrada',
    className: 'text-rose-800',
    descripcion: 'Es visible, pero no acepta votos',
  },
  abierta: {
    label: 'Abierta',
    className: 'text-emerald-700 animate-pulse duration-1000',
    descripcion: 'Acepta votos, pero no está en pantalla',
  },
  pausada: {
    label: 'Pausada',
    className: 'text-amber-600',
    descripcion: 'Está en pantalla, pero no acepta votos todavía',
  },
  enfocada: {
    label: 'Enfocada',
    className: 'text-indigo-500 font-bold animate-pulse duration-500',
    descripcion: 'Está en pantalla y acepta votos',
  },
  revelada: {
    label: 'Revelada',
    className: 'text-cyan-600 font-bold',
    descripcion: 'Está en pantalla, con los votos revelados',
  },
  participada: {
    label: 'Participada',
    className: 'text-teal-600',
    descripcion: 'Acepta votos con los votos revelados, pero no está en pantalla',
  },
  concluida: {
    label: 'Concluida',
    className: 'text-slate-600 font-semibold',
    descripcion: 'Terminó su ciclo: cerrada, revelada y fuera de pantalla',
  },
}

type AccionesAvance = Pick<
  ReturnType<typeof useConexionProfe>,
  'publicar' | 'abrir' | 'cerrar' | 'enfocar' | 'desenfocar' | 'revelar'
>

// El estado de una encuesta puede cambiar por fuera del botón (toggles manuales en AccionesToggle),
// así que un paso nunca asume en qué flags está: cada acción se manda solo si hace falta. Sin esto,
// pedirle al server algo que ya es cierto (ej: enfocar una que ya está enfocada) lo hace explotar
// (`updatePoll` lo rechaza con un throw sin catch para ese caso).
const publicarSiHaceFalta = (a: AccionesAvance, e: Encuesta) => {
  if (!e.isPublished) a.publicar(e.id)
}
const abrirSiHaceFalta = (a: AccionesAvance, e: Encuesta) => {
  if (!e.isOpen) a.abrir(e.id)
}
const cerrarSiHaceFalta = (a: AccionesAvance, e: Encuesta) => {
  if (e.isOpen) a.cerrar(e.id)
}
const enfocarSiHaceFalta = (a: AccionesAvance, e: Encuesta) => {
  if (!e.isFocused) a.enfocar(e.id)
}
const desenfocarSiHaceFalta = (a: AccionesAvance, e: Encuesta) => {
  if (e.isFocused) a.desenfocar(e.id)
}
const revelarSiHaceFalta = (a: AccionesAvance, e: Encuesta) => {
  if (!e.isRevealed) a.revelar(e.id)
}

/** El paso "típico" siguiente para cada estado: qué hacer y cómo describírselo al profe. */
const PASOS: Record<
  EstadoEncuesta,
  { descripcion: string; avanzar: (a: AccionesAvance, e: Encuesta) => void } | null
> = {
  oculta: {
    descripcion: 'Publicar, abrir y enfocar la pregunta',
    avanzar: (a, e) => {
      publicarSiHaceFalta(a, e)
      abrirSiHaceFalta(a, e)
      enfocarSiHaceFalta(a, e)
    },
  },
  cerrada: {
    descripcion: 'Abrir y enfocar la pregunta',
    avanzar: (a, e) => {
      abrirSiHaceFalta(a, e)
      enfocarSiHaceFalta(a, e)
    },
  },
  abierta: {
    descripcion: 'Enfocar la pregunta',
    avanzar: enfocarSiHaceFalta,
  },
  pausada: {
    descripcion: 'Revelar los votos',
    avanzar: revelarSiHaceFalta,
  },
  enfocada: {
    descripcion: 'Cerrar la votación y revelar los votos',
    avanzar: (a, e) => {
      cerrarSiHaceFalta(a, e)
      revelarSiHaceFalta(a, e)
    },
  },
  revelada: {
    descripcion: 'Desenfocar: marcar la pregunta como concluida',
    avanzar: desenfocarSiHaceFalta,
  },
  participada: {
    descripcion: 'Cerrar la votación',
    avanzar: cerrarSiHaceFalta,
  },
  concluida: null,
  archivada: null,
}

/** Botón "avanzar al siguiente estado": infiere y ejecuta el paso típico siguiente para esta encuesta. */
export function AvanzarEstado({ encuesta }: { encuesta: Encuesta }) {
  const acciones = useConexionProfe()
  const paso = PASOS[estadoEncuesta(encuesta)]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" disabled={!paso} onClick={() => paso?.avanzar(acciones, encuesta)}>
          <StepForward className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{paso ? paso.descripcion : 'Esta pregunta ya concluyó su ciclo'}</p>
      </TooltipContent>
    </Tooltip>
  )
}
