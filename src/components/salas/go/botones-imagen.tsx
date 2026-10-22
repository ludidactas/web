import { Icon } from '@iconify/react/dist/iconify.js'

/** Descargar y copiar la imagen de una partida terminada. `copiado` confirma la copia por un instante. */
export function BotonesImagen({
  onDescargar,
  onCopiar,
  copiado = false,
}: {
  onDescargar: () => void
  onCopiar: () => void
  copiado?: boolean
}) {
  return (
    <div className="flex items-stretch rounded-xl border overflow-hidden divide-x">
      <button
        className="flex flex-1 gap-1 items-center justify-center whitespace-nowrap text-sm p-2 hover:bg-slate-100"
        onClick={onDescargar}
      >
        <Icon className="w-6 h-6" icon={'lucide:download'} />
        Descargar imagen
      </button>
      <button
        className="flex flex-1 gap-1 items-center justify-center whitespace-nowrap text-sm p-2 hover:bg-slate-100"
        onClick={onCopiar}
      >
        <Icon className="w-6 h-6" icon={copiado ? 'lucide:check' : 'lucide:copy'} />
        {copiado ? 'Imagen copiada' : 'Copiar imagen'}
      </button>
    </div>
  )
}
