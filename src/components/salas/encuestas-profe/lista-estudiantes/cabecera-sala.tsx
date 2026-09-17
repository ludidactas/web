import { useState } from 'react'
import { Icon } from '@iconify/react/dist/iconify.js'

import { cn } from '@/lib/utils'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { MetodosLogin } from '@/wss/validators/auth'
import PanelConfigSala from '../panel-config-sala'
import { DialogMostrarQR } from './dialog-mostrar-qr'

/** Título de la sala y las acciones para compartirla: configurar el acceso (solo por DNI), copiar
 * el link, y mostrar el QR. */
export function CabeceraSala() {
  const { config: configSala } = storeConfig()
  const [linkCopiado, setLinkCopiado] = useState(false)

  const tituloSala =
    configSala?.nombre?.trim() || (configSala?.nombre_profe ? `Sala de ${configSala.nombre_profe}` : 'Tu sala')

  return (
    <>
      <div className={cn('flex flex-col md:flex-row items-center md:justify-between gap-2 mb-3')}>
        <h1 className={cn('flex items-center gap-2 text-4xl md:text-5xl font-medium text-ld-violeta-oscuro mb-4')}>
          <Icon className='md:w-12 md:h-12 w-8 h-8' icon="fluent:conference-room-24-regular" width={28} height={28} /> Tu sala
        </h1>

        <div className={cn('flex md:flex-col gap-2')}>
          {/* Config solo si es por DNI: en salas por nombre no hay contenido útil para mostrar */}
          {configSala?.metodo_login === MetodosLogin.DNI && (
            <div className="contents md:relative md:block md:w-11 md:h-11 md:shrink-0">
              <PanelConfigSala>
                <button
                  className={cn(
                    'group flex items-center w-fit justify-center gap-2 md:gap-0 md:hover:gap-2 font-semibold text-white text-sm px-4 py-3 md:py-0 rounded-full bg-ld-violeta-oscuro hover:bg-ld-violeta-oscuro/80 transition-colors md:absolute md:right-0 md:top-0 md:z-10 md:h-11 md:flex-row-reverse md:justify-start md:hover:px-4 md:text-base'
                  )}
                  title="Configurá el acceso a tu sala"
                >
                  <Icon icon="lucide:settings" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  <span className="hidden md:block whitespace-nowrap md:max-w-0 md:overflow-hidden md:group-hover:max-w-[120px] md:transition-all md:duration-300 md:ease-in-out">
                    Configurar
                  </span>
                </button>
              </PanelConfigSala>
            </div>
          )}

          {configSala?.link && (
            <>
              <div className="contents md:relative md:block md:w-11 md:h-11 md:shrink-0">
                <button
                  className={cn(
                    'group flex items-center w-fit justify-center gap-2 md:gap-0 md:hover:gap-2 font-semibold text-white text-sm px-4 py-3 md:py-0 rounded-full transition-colors md:absolute md:right-0 md:top-0 md:z-10 md:h-11 md:flex-row-reverse md:justify-start md:hover:px-4 md:text-base',
                    linkCopiado
                      ? 'bg-emerald-500 hover:bg-emerald-500/80'
                      : 'bg-ld-violeta-oscuro hover:bg-ld-violeta-oscuro/80'
                  )}
                  onClick={() => {
                    navigator.clipboard.writeText(configSala.link)
                    setLinkCopiado(true)
                    setTimeout(() => setLinkCopiado(false), 2000)
                  }}
                  title="Copiá el link para compartirlo con tus estudiantes"
                >
                  {linkCopiado ? (
                    <Icon icon="lucide:check" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  ) : (
                    <Icon icon="lucide:link" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  )}
                  <span className="hidden md:block whitespace-nowrap md:max-w-0 md:overflow-hidden md:group-hover:max-w-[120px] md:transition-all md:duration-300 md:ease-in-out">
                    {linkCopiado ? '¡Copiado!' : 'Copiar link'}
                  </span>
                </button>
              </div>

              <DialogMostrarQR link={configSala.link} titulo={tituloSala} />
            </>
          )}
        </div>
      </div>

      {!configSala?.link && <p className={cn('text-center text-rose-500 text-sm pt-2')}>Link de sala no recibido</p>}
    </>
  )
}
