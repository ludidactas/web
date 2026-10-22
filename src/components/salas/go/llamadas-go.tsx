import { Boton } from '@/components/custom/ld-boton-svg'
import { cn } from '@/lib/utils'
import { Icon } from '@iconify/react/dist/iconify.js'
import Link from 'next/link'

/** Texto con un botón que lleva a otra parte de Go: las invitaciones al pie de las pantallas de juego y del Dojo. */
function LlamadaGo({
  texto,
  href,
  icono,
  etiqueta,
  className,
}: {
  texto: string
  href: string
  icono: string
  etiqueta: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3 items-center w-full', className)}>
      <p className="text-slate-500 text-sm text-center max-w-2xl">{texto}</p>
      <Link href={href}>
        <Boton
          color="#6366f1"
          shadowColor="#4338ca"
          classNames={{ root: 'flex items-center p-2 justify-center w-40 h-16 hover:scale-105 transition-transform' }}
        >
          <div className="flex items-center gap-1">
            <Icon className="text-white" icon={icono} />
            <span className="text-md font-bold text-white">{etiqueta}</span>
          </div>
        </Boton>
      </Link>
    </div>
  )
}

/** Invitación a practicar en el Dojo de Go, para quienes recién empiezan. */
export function LlamadaDojo({ className }: { className?: string }) {
  return (
    <LlamadaGo
      texto="Si aún estás aprendiendo a jugar, te invitamos a que visites nuestro Dojo de Go y practiques con nosotros."
      href="/go/dojo"
      icono="fluent-emoji-high-contrast:shinto-shrine"
      etiqueta="Ir al Dojo"
      className={className}
    />
  )
}

/** Invitación a usar el tablero local, para quienes tienen con quién jugar. */
export function LlamadaTablero({ className }: { className?: string }) {
  return (
    <LlamadaGo
      texto="Si tenés alguien con quien jugar compartiendo tu dispositivo, podés usar nuestro tablero para jugar por territorio y atari Go. Al terminar podés guardar el resultado y compartirlo como imágen."
      href="/go/tablero"
      icono="tabler:go-game"
      etiqueta="Ir al tablero"
      className={className}
    />
  )
}

/** Invitación a usar las salas, para quienes quieran jugar online. */
export function LlamadaSalaOnline({ className }: { className?: string }) {
  return (
    <LlamadaGo
      texto="Si querés jugar online, podés crear una sala y compartir el link. Todas las personas con el link pueden entrar a la sala a jugar partidas y observar las que haya en curso."
      href="/salas"
      icono="akar-icons:people-group"
      etiqueta="Ir a salas"
      className={className}
    />
  )
}
