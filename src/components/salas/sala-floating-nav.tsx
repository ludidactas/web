'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/** Botones flotantes (abajo a la derecha) para alternar entre las vistas de la sala, cada una con su
 * propia ruta (`{basePath}/[idSala]/encuestas`, `{basePath}/[idSala]/go`). Se reutiliza tanto para la
 * sala del profe (`/salas`, por defecto) como para la del estudiante (`/sala`). */
export default function SalaFloatingNav({ idSala, basePath = '/salas' }: { idSala: string; basePath?: string }) {
  const pathname = usePathname()
  const enGo = pathname?.endsWith('/go')

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3">
      <BotonFlotante
        href={`${basePath}/${idSala}/encuestas`}
        activo={!enGo}
        src="/img/EncuestaIcon.png"
        alt="Encuestas"
      />
      <BotonFlotante href={`${basePath}/${idSala}/go`} activo={!!enGo} src="/img/Go.png" alt="Go" />
    </div>
  )
}

function BotonFlotante({ href, activo, src, alt }: { href: string; activo: boolean; src: string; alt: string }) {
  return (
    <Link
      href={href}
      aria-label={alt}
      aria-current={activo}
      className={cn(
        'w-20 h-20 p-1 rounded-full shadow-lg overflow-hidden bg-white transition-transform hover:scale-105 active:scale-95',
        activo ? 'ring-4 ring-ld-violeta' : 'ring-2 ring-white'
      )}
    >
      <Image src={src} alt={alt} width={56} height={56} className="w-full h-full object-contain" />
    </Link>
  )
}
