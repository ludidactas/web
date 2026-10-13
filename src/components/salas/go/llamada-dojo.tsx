import { Boton } from '@/components/custom/ld-boton-svg'
import { Icon } from '@iconify/react/dist/iconify.js'
import Link from 'next/link'

/** Invitación a practicar en el Dojo de Go, para quienes recién empiezan. Se usa al pie de las pantallas de juego. */
export function LlamadaDojo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 items-center w-full ${className ?? ''}`}>
      <p className="text-slate-500 text-sm text-center">
        Si aún estás aprendiendo a jugar, te invitamos a que visites nuestro Dojo de Go y practiques con nosotros.
      </p>
      <Link href="/go/dojo">
        <Boton
          color="#6366f1"
          shadowColor="#4338ca"
          classNames={{ root: 'flex items-center p-2 justify-center w-36 h-16 hover:scale-105 transition-transform' }}
        >
          <div className="flex items-center gap-1">
            <Icon className="text-white" icon={'fluent-emoji-high-contrast:shinto-shrine'} />
            <span className="text-md font-bold text-white">Ir al Dojo</span>
          </div>
        </Boton>
      </Link>
    </div>
  )
}
