import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react/dist/iconify.js'

import { cn } from '@/lib/utils'
import { storeConfig } from '@/wss-cli/stores/config-store'
import PanelConfigSala from '../panel-config-sala'
import { DialogMostrarQR } from './dialog-mostrar-qr'

/** Título de la sala, configuración del acceso, y el link para compartirla (abre la vista de
 * estudiante; se puede copiar o mostrar como QR). El link apunta a la herramienta en la que está
 * parado el profe (Encuestas o Go), así el estudiante entra directo ahí. */
export function CabeceraSala() {
  const { config: configSala } = storeConfig()
  const [linkCopiado, setLinkCopiado] = useState(false)
  const pathname = usePathname()
  const herramienta = pathname?.endsWith('/go') ? 'go' : 'encuestas'
  const link = configSala?.link ? `${configSala.link}${herramienta}` : undefined

  const tituloSala =
    configSala?.nombre?.trim() || (configSala?.nombre_profe ? `Sala de ${configSala.nombre_profe}` : 'Tu sala')

  return (
    <>
      <div className={cn('flex items-center justify-between gap-2 mb-2')}>
        <h1 className={cn('flex items-center gap-2 text-4xl md:text-5xl font-medium text-ld-violeta-oscuro')}>
          <Icon className="md:w-12 md:h-12 w-8 h-8" icon="fluent:conference-room-24-regular" width={28} height={28} />{' '}
          Tu sala
        </h1>

        <div className="relative w-11 h-11 shrink-0">
          <PanelConfigSala>
            <button
              className={cn(
                'group absolute right-0 top-0 z-10 flex flex-row-reverse items-center justify-start gap-0 hover:gap-2 h-11 px-3.5 hover:px-4 rounded-full font-semibold text-white text-base bg-ld-violeta-oscuro hover:bg-ld-violeta-oscuro/80 transition-colors'
              )}
              title="Configurá el acceso a tu sala"
            >
              <Icon icon="lucide:settings" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <span className="whitespace-nowrap max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 ease-in-out">
                Configurar
              </span>
            </button>
          </PanelConfigSala>
        </div>
      </div>

      {link && (
        <>
          <p className="mb-3">¡Compartí el link de tu sala con lxs participantes!</p>

          <div className={cn('flex flex-wrap items-center gap-2 mb-3')}>
            <div className="flex basis-full md:basis-0 flex-1 min-w-0 items-center gap-2 h-10 px-3 rounded-md bg-ld-azul/5">
              <Icon icon="akar-icons:link-chain" className="w-5 h-5 shrink-0" />
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 truncate text-ld-azul hover:underline"
                title="Abrir vista de participante"
              >
                {link.replace(/^https?:\/\//, '')}
              </a>
            </div>

            <button
              className={cn(
                'flex items-center gap-2 h-10 px-4 rounded-lg font-semibold text-white transition-colors',
                linkCopiado ? 'bg-emerald-500 hover:bg-emerald-500/80' : 'bg-ld-violeta-oscuro hover:bg-ld-violeta-oscuro/80'
              )}
              onClick={() => {
                navigator.clipboard.writeText(link)
                setLinkCopiado(true)
                setTimeout(() => setLinkCopiado(false), 2000)
              }}
              title="Copiá el link para compartirlo con los participantes"
            >
              <Icon icon={linkCopiado ? 'lucide:check' : 'lucide:copy'} className="w-4 h-4 shrink-0" />
              {linkCopiado ? '¡Copiado!' : 'Copiar'}
            </button>

            <DialogMostrarQR link={link} titulo={tituloSala} />
          </div>
        </>
      )}

      {!link && <p className={cn('text-center text-rose-500 text-sm pt-2')}>Link de sala no recibido</p>}
    </>
  )
}
