import { useEffect, useMemo, useState } from 'react'
import { emitirConAck } from '@/wss-cli/emitir-con-ack'
import { handshake, type SocketWssCli } from '@/wss-cli/utils-socket-wss'
import { RolSala } from '@/wss/validators/auth'
import { FORMATO_ID_DOJO, type ProgresoDojoRemoto } from '@/wss/validators/dojo'
import type { SincronizacionDojo } from '@/lib/go-dojo/components/use-progreso-dojo'

const CLAVE_ID = 'go-dojo-id'
const PARAM_ID = 'id'
/** Cuánto se espera a tener conexión e id antes de seguir solo con localStorage. */
const ESPERA_MAXIMA_MS = 5000

function leerIdGuardado(): string | undefined {
  try {
    return localStorage.getItem(CLAVE_ID) ?? undefined
  } catch {
    return undefined
  }
}

function guardarId(id: string) {
  try {
    localStorage.setItem(CLAVE_ID, id)
  } catch {
    // Storage bloqueado (modo privado): el id vive mientras dure la pestaña.
  }
}

/**
 * El id de `?id=` (que sale de la URL) o, si no hay, el guardado en localStorage. El de la URL se guarda
 * enseguida, así una segunda corrida del efecto (StrictMode) lo lee de localStorage.
 */
function idCandidato(): string | undefined {
  const url = new URL(window.location.href)
  const deUrl = url.searchParams.get(PARAM_ID)
  if (deUrl !== null) {
    url.searchParams.delete(PARAM_ID)
    window.history.replaceState(window.history.state, '', url)
    if (FORMATO_ID_DOJO.test(deUrl)) {
      guardarId(deUrl)
      return deUrl
    }
  }
  const guardado = leerIdGuardado()
  return guardado && FORMATO_ID_DOJO.test(guardado) ? guardado : undefined
}

/** Link que abre el dojo con el progreso de `idDojo`. */
export function linkProgresoDojo(idDojo: string) {
  return `${window.location.origin}/go/dojo?${PARAM_ID}=${idDojo}`
}

/**
 * Conexión al WSS como visitante anónimo del dojo y copia remota del progreso de un capítulo. El id lo
 * valida el server al conectar y `dojo:identificarse` lo confirma, en cada conexión o reconexión; hasta
 * tenerlo no hay `sincronizacion`. `esperando` es true hasta que hay id, falla la conexión o se agota la
 * espera máxima.
 */
export function useSincronizacionDojo(coleccion: string, capitulo: string) {
  const [idDojo, setIdDojo] = useState<string | null>(null)
  const [socket, setSocket] = useState<SocketWssCli | null>(null)
  const [esperando, setEsperando] = useState(true)

  useEffect(() => {
    let vigente = true
    const dejarDeEsperar = () => vigente && setEsperando(false)
    const timer = setTimeout(dejarDeEsperar, ESPERA_MAXIMA_MS)
    let sock: SocketWssCli | undefined

    async function identificarse(sock: SocketWssCli) {
      try {
        const id = await emitirConAck<string>(sock, 'dojo:identificarse')
        if (!vigente) return
        // Las reconexiones presentan el id definitivo.
        sock.auth = { rol: RolSala.Dojo, idDojo: id }
        guardarId(id)
        setIdDojo(id)
        setSocket(sock)
        setEsperando(false)
      } catch (error: unknown) {
        console.error('No se pudo identificar al visitante del dojo', error)
        dejarDeEsperar()
      }
    }

    async function conectar() {
      const nuevo = await handshake({ rol: RolSala.Dojo, idDojo: idCandidato() }, { reconnection: true })
      if (!vigente) return
      sock = nuevo
      nuevo.on('connect', () => void identificarse(nuevo))
      nuevo.on('connect_error', dejarDeEsperar)
      nuevo.connect()
    }
    void conectar()

    return () => {
      vigente = false
      clearTimeout(timer)
      sock?.disconnect()
    }
  }, [])

  const sincronizacion = useMemo<SincronizacionDojo | undefined>(() => {
    if (!socket) return undefined

    async function enviar(evento: string, payload: unknown) {
      try {
        await emitirConAck(socket!, evento, payload)
      } catch (error: unknown) {
        console.error(`No se pudo enviar ${evento} al progreso remoto del dojo`, error)
      }
    }

    return {
      sincronizar: (resueltos) =>
        emitirConAck<ProgresoDojoRemoto>(socket, 'dojo:sincronizar', { coleccion, capitulo, resueltos }),
      marcarResuelto: (desafio) => void enviar('dojo:resuelto', { coleccion, capitulo, desafio }),
      guardarActual: (desafio) => void enviar('dojo:actual', { coleccion, capitulo, desafio }),
    }
  }, [socket, coleccion, capitulo])

  return { idDojo, sincronizacion, esperando }
}
