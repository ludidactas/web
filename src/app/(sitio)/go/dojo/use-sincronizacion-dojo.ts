import { useEffect, useMemo, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { Ack } from '@/wss/middleware/error-handling'
import type { ProgresoDojoRemoto } from '@/wss/validators/dojo'
import type { SincronizacionDojo } from '@/lib/go-dojo/components/use-progreso-dojo'

const CLAVE_ID = 'go-dojo-id'
const PARAM_ID = 'id'

function handshakeDojo(): Socket {
  return io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/dojo`, { autoConnect: false, reconnection: true })
}

async function conAck<T>(socket: Socket, evento: string, payload: unknown): Promise<T> {
  const res: Ack<T> = await socket.timeout(5000).emitWithAck(evento, payload)
  if (!res.ok) throw new Error(res.error)
  return res.data
}

/** El id de `?id=` (que sale de la URL) o, si no hay, el guardado en localStorage. */
function idCandidato(): string | undefined {
  const url = new URL(window.location.href)
  const deUrl = url.searchParams.get(PARAM_ID)
  if (deUrl !== null) {
    url.searchParams.delete(PARAM_ID)
    window.history.replaceState(window.history.state, '', url)
    return deUrl
  }
  try {
    return localStorage.getItem(CLAVE_ID) ?? undefined
  } catch {
    return undefined
  }
}

/** Link que abre el dojo con el progreso de `idDojo`. */
export function linkProgresoDojo(idDojo: string) {
  return `${window.location.origin}/go/dojo?${PARAM_ID}=${idDojo}`
}

/**
 * Conexión al WSS como visitante anónimo del dojo y copia remota del progreso de `capitulo`. El id lo
 * emite el server (`dojo:identificarse`), en cada conexión o reconexión; hasta tenerlo no hay `sincronizacion`.
 */
export function useSincronizacionDojo(capitulo: string) {
  const [idDojo, setIdDojo] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    let pedido = idCandidato()
    let vigente = true
    const sock = handshakeDojo()

    async function identificarse() {
      try {
        const id = await conAck<string>(sock, 'dojo:identificarse', { idDojo: pedido })
        if (!vigente) return
        pedido = id
        try {
          localStorage.setItem(CLAVE_ID, id)
        } catch {}
        setIdDojo(id)
        setSocket(sock)
      } catch (error: unknown) {
        console.error('No se pudo identificar al visitante del dojo', error)
      }
    }

    sock.on('connect', identificarse)
    sock.connect()

    return () => {
      vigente = false
      sock.disconnect()
    }
  }, [])

  const sincronizacion = useMemo<SincronizacionDojo | undefined>(() => {
    if (!socket) return undefined
    return {
      sincronizar: (resueltos) => conAck<ProgresoDojoRemoto>(socket, 'dojo:sincronizar', { capitulo, resueltos }),
      marcarResuelto: (desafio) => socket.emit('dojo:resuelto', { capitulo, desafio }),
      guardarActual: (desafio) => socket.emit('dojo:actual', { capitulo, desafio }),
    }
  }, [socket, capitulo])

  return { idDojo, sincronizacion }
}
