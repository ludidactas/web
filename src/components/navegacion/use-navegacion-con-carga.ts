'use client'

import { MouseEvent, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// isPending queda en true hasta que React comitea la próxima UI para esa navegación,
// que puede ser el loading.tsx de destino (Suspense fallback) — por eso alcanza para
// tapar justo el hueco entre el click y que arranque el loading state server-side.
export function useNavegacionConCarga() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navegar = (href: string) => {
    startTransition(() => {
      router.push(href)
    })
  }

  /** Wrapper de navegar listo para plugear en onClick={____} */
  const onClickNavegar = (href: string) => (e: MouseEvent) => {
    e.preventDefault()
    navegar(href)
  }

  return { isPending, navegar, onClickNavegar }
}
