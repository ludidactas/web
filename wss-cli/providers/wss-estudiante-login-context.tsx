'use client'

import { useSession } from 'next-auth/react'
import { storeEstudianteLogin } from '../stores/estudiante-login-store'
import { useEffect } from 'react'

export function useLoginSalaEstudiante({ idSala }: { idSala: string }) {
  const store = storeEstudianteLogin()
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
  }, [idSala])

  // Derivamos el nombre cosiendo el provisto y el de la sesión de Google
  const nombreFinal = status === 'authenticated' ? session?.user?.name || 'Usuario' : store.nombre

  return {
    ...store,
    nombre: nombreFinal,
  }
}
