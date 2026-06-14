'use client'

import { useSession } from 'next-auth/react'
import { storeEstudianteLogin } from '../stores/estudiante-login-store'
import { useEffect, useState } from 'react'
import { storeConfig } from '../stores/config-store'
import { MetodosLogin } from '@/wss/validators/auth'

export function useLoginSalaEstudiante({ idSala }: { idSala: string }) {
  const store = storeEstudianteLogin()
  const { config } = storeConfig()
  const { data: session, status } = useSession()

  const [ready, setReady] = useState(false)

  // Al cambiar de sala, limpiamos la config stale para que el guard `!config` funcione
  useEffect(() => {
    storeConfig.getState().set(null)
  }, [idSala])

  // Cargamos lo que hubiera en el localStorage
  useEffect(() => {
    // Esperamos hasta recibir config de la sala y status de auth de google
    if (!config || status === 'loading') return

    // Levantamos los datos que pudiera tener en el storage
    // (nombre y dni previamente usadosd esde este device)
    const storedName = localStorage.getItem(`encuestas-nombre-${idSala}`)
    if (storedName) {
      store.setNombre(storedName)
    }
    const storedDni = localStorage.getItem(`encuestas-dni-${idSala}`)
    if (storedDni) {
      store.setDNI(storedDni)
    }

    // clientId estable por sala: identifica al estudiante entre reconexiones
    let clientId = localStorage.getItem(`encuestas-clientid-${idSala}`)
    if (!clientId) {
      clientId = crypto.randomUUID()
      localStorage.setItem(`encuestas-clientid-${idSala}`, clientId)
    }
    store.setClientId(clientId)

    const storeIngresado = localStorage.getItem(`encuestas-ingresado-${idSala}`) === '1'

    // Si tiene todos los datos necesatios, lo ingresamos directo -- no está andando, hay que arreglar una race condition
    if (config.esquema === MetodosLogin.DNI) {
      store.setIngresado(storeIngresado && !!storedDni && !!storedName)
    } else {
      store.setIngresado(storeIngresado && !!storedName)
    }

    setReady(true)
  }, [idSala, config, status])

  // Derivamos el nombre: si hay sesión de Google usamos ese, sino el que haya provisto
  const nombreFinal = status === 'authenticated' ? session?.user?.name || 'Usuario' : store.nombre

  return {
    ...store,
    ready,
    nombre: nombreFinal,
  }
}
