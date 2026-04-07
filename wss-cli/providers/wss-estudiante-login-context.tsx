'use client'

import { useSession } from 'next-auth/react'
import { storeEstudianteLogin } from '../stores/estudiante-login-store'
import { useEffect } from 'react'
import { storeConfig } from '../stores/config-store'

export function useLoginSalaEstudiante({ idSala }: { idSala: string }) {
  const store = storeEstudianteLogin()
  const { config } = storeConfig()
  const { data: session, status } = useSession()

  // Cargamos lo que hubiera en el localStorage
  useEffect(() => {
    const storedName = localStorage.getItem(`encuestas-nombre-${idSala}`)
    if (storedName) {
      store.setNombre(storedName)
    }
    const storedDni = localStorage.getItem(`encuestas-dni-${idSala}`)
    if (storedDni) {
      store.setDNI(storedDni)
    }

    if (!config) return

    if (config.pedir_dni) {
      store.setIngresado(!!storedDni && !!storedName)
    } else {
      store.setIngresado(!!storedName)
    }
  }, [idSala, config])

  // Derivamos el nombre cosiendo el provisto y el de la sesión de Google
  const nombreFinal = status === 'authenticated' ? session?.user?.name || 'Usuario' : store.nombre

  return {
    ...store,
    nombre: nombreFinal,
  }
}
