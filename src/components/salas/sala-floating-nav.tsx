'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/** Botones flotantes (abajo a la derecha) para alternar entre las vistas de la sala del profe, cada
 * una con su propia ruta (`/salas/[idSala]/encuestas`, `/salas/[idSala]/go`). */
export default function SalaFloatingNav({ idSala }: { idSala: string }) {
  const pathname = usePathname()
  const enGo = pathname?.endsWith('/go')

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3">
      <BotonFlotante href={`/salas/${idSala}/encuestas`} activo={!enGo} src="/img/iconpoll.webp" alt="Encuestas" />
      <BotonFlotante href={`/salas/${idSala}/go`} activo={!!enGo} src="/img/Go.png" alt="Go" />
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
        'w-14 h-14 rounded-full shadow-lg overflow-hidden bg-white transition-transform hover:scale-105 active:scale-95',
        activo ? 'ring-4 ring-ld-violeta' : 'ring-2 ring-white'
      )}
    >
      <Image src={src} alt={alt} width={56} height={56} className="w-full h-full object-cover" />
    </Link>
  )
}
