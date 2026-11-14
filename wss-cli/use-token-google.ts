'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { tokenWss } from '@/server/token_wss'
import { storeEstudianteLogin } from './stores/estudiante-login-store'

export type StatusTokenGoogle = 'inactivo' | 'cargando' | 'listo'

/**
 * Token que firma Next con la cuenta de Google de la sesión: es lo que el estudiante de una sala `google`
 * presenta al WSS, que de ahí saca su email verificado. Se pide mientras `activo` y se descarta al
 * dejar de estarlo, para no reusarlo con otra cuenta. Si no se puede obtener, avisa y devuelve al
 * estudiante a la pantalla de ingreso de la sala.
 */
export function useTokenGoogle({ idSala, activo }: { idSala: string; activo: boolean }) {
  const [token, setToken] = useState<string>()

  useEffect(() => {
    if (!activo) {
      setToken(undefined)
      return
    }
    let vigente = true
    tokenWss()
      .then((t) => vigente && setToken(t))
      .catch(() => {
        toast.error('No pudimos iniciar tu sesión de Google. Volvé a ingresar.')
        localStorage.setItem(`encuestas-ingresado-${idSala}`, '0')
        storeEstudianteLogin.getState().setIngresado(false)
      })
    return () => {
      vigente = false
    }
  }, [activo, idSala])

  const status: StatusTokenGoogle = !activo ? 'inactivo' : token ? 'listo' : 'cargando'
  return { token, status }
}
