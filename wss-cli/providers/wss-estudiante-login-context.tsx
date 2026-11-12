'use client'

import { useSession } from 'next-auth/react'
import { storeEstudianteLogin } from '../stores/estudiante-login-store'
import { useEffect, useState } from 'react'
import { storeConfig } from '../stores/config-store'
import { MetodosLogin } from '@/wss/validators/auth'
import { idAleatorio } from '../utils-id'
import { leerDni, limpiarDnisVencidos } from '../dni-guardado'

export function useLoginSalaEstudiante({ idSala }: { idSala: string }) {
  const store = storeEstudianteLogin()
  const { config } = storeConfig()
  const { status, data: sesionGoogle } = useSession()

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
    limpiarDnisVencidos()
    const storedDni = leerDni(idSala)
    if (storedDni) {
      store.setDNI(storedDni)
    }

    // clientId estable por sala: identifica al estudiante entre reconexiones
    let clientId = localStorage.getItem(`encuestas-clientid-${idSala}`)
    if (!clientId) {
      clientId = idAleatorio()
      localStorage.setItem(`encuestas-clientid-${idSala}`, clientId)
    }
    store.setClientId(clientId)

    const storeIngresado = localStorage.getItem(`encuestas-ingresado-${idSala}`) === '1'

    // Si tiene todos los datos necesatios, lo ingresamos directo -- no está andando, hay que arreglar una race condition
    if (config.metodo_login === MetodosLogin.Google) {
      // La identidad es la sesión de Google: sin sesión, vuelve a la pantalla de ingreso.
      store.setIngresado(storeIngresado && status === 'authenticated')
    } else if (config.metodo_login === MetodosLogin.DNI) {
      store.setIngresado(storeIngresado && !!storedDni && !!storedName)
    } else {
      store.setIngresado(storeIngresado && !!storedName)
    }

    setReady(true)
  }, [idSala, config, status])

  // Fuera de las salas `google`, el nombre es siempre el que tipeó el estudiante. (NO derivarlo de la
  // sesión de Google: en el navegador del profe esa sesión es la suya y terminaría secuestrando el nombre.)
  return {
    ...store,
    ready,
    nombre: store.nombre,
    /** Cuenta de Google de esta sesión, para las salas `google`. Es el estado de la sesión de Next, `status` incluido. */
    google: { status, usuario: sesionGoogle?.user },
  }
}
