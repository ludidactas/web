'use client'

import { useEffect } from 'react'
import { storeConfig } from '@/wss-cli/stores/config-store'

/** Sincroniza el título de la pestaña con el nombre de la sala activa. Effectful, sin UI. */
export function TituloPestanaSala() {
  const nombre = storeConfig((s) => s.config?.nombre)

  useEffect(() => {
    if (!nombre) return
    const previo = document.title
    document.title = nombre
    return () => {
      document.title = previo
    }
  }, [nombre])

  return null
}
