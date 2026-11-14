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

  // El método de login de la sala, capturado y fijado la primera vez que llega su config.
  const [metodoLogin, setMetodoLogin] = useState<MetodosLogin>()

  // Al cambiar de sala, limpiamos la config stale para que el guard `!config` funcione
  useEffect(() => {
    storeConfig.getState().set(null)
    setMetodoLogin(undefined)
  }, [idSala])

  // Cargamos lo que hubiera en el localStorage
  useEffect(() => {
    // Esperamos hasta recibir config de la sala y status de auth de google
    if (!config || status === 'loading') return

    setMetodoLogin(config.metodo_login)

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
      // La identidad es la sesión de Google: sin sesión, vuelve a la pantalla de ingreso. Un login que no
      // llegó a abrir sesión (cancelado, rechazado) no deja el ingreso marcado para la próxima vez.
      if (status === 'unauthenticated') localStorage.setItem(`encuestas-ingresado-${idSala}`, '0')
      store.setIngresado(storeIngresado && status === 'authenticated')
    } else if (config.metodo_login === MetodosLogin.DNI) {
      store.setIngresado(storeIngresado && !!storedDni && !!storedName)
    } else {
      store.setIngresado(storeIngresado && !!storedName)
    }

    setReady(true)
  }, [idSala, config, status])

  // En las salas `google` el nombre es el de la cuenta; en las demás, el que tipeó el estudiante. (NO
  // derivarlo de la sesión fuera de las salas `google`: en el navegador del profe esa sesión es la suya
  // y terminaría secuestrando el nombre.)
  const nombre =
    metodoLogin === MetodosLogin.Google ? sesionGoogle?.user?.name || sesionGoogle?.user?.email || '' : store.nombre
  // Identificador con el que el server reconoce al estudiante (`userId` de su sesión).
  const userId =
    metodoLogin === MetodosLogin.Google ? sesionGoogle?.user?.email || '' : store.dni || store.nombre || ''

  return {
    ...store,
    userId,
    ready,
    metodoLogin,
    nombre,
    /** Cuenta de Google de esta sesión, para las salas `google`. Es el estado de la sesión de Next, `status` incluido. */
    google: { status, usuario: sesionGoogle?.user },
  }
}
