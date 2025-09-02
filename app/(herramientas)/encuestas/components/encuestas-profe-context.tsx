'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useServerWebsockets } from './use-server-encuestas'
import { useEncuestaStore } from './encuestas-store'
import { CrearEncuesta, Encuesta, RolEncuesta } from '@/wss/tipos'


/** Cose el socket con el state para profe */
const useEncuestaProfeState = (nombre?: string) => {

  // El profe recibe el id de la sala del server de ws
  const [linkSala, setLinkSala] = useState<string | null>(null)
  
  // El profe se conecta con su email como idSala
  const { socket, conectado, conectando, error } = useServerWebsockets({ nombre, rol: RolEncuesta.Profe })
  const { encuestas, addEncuesta, setEncuestas, updateEncuesta, deleteEncuesta} = useEncuestaStore()

  /** Postea al server la acción de crear */
  const enviarPregunta = async (pregunta: string, respuestas: string[]) => {
    const nuevaEncuesta: CrearEncuesta = {
      pregunta,
      opciones: respuestas,
    }

    socket!.emit('poll:create', nuevaEncuesta)
  }

  /** Postea al server la acción de borrar */
  const borrarPregunta = (encuestaId: string) => { socket!.emit('poll:delete', { pollId: encuestaId }) }

  /** Postea al server la acción de cerrar */
  const cerrarPregunta = (encuestaId: string) => { socket!.emit('poll:close', { pollId: encuestaId }) }

  /** Postea al server la acción de abrir */
  const abrirPregunta = (encuestaId: string) => { socket!.emit('poll:open', { pollId: encuestaId }) }

  /** Postea al sever la acción de publicar */
  const publicarPregunta = (encuestaId: string) => { socket!.emit('poll:publish', { pollId: encuestaId }) }

  /** Postea al sever la acción de publicar */
  const esconderPregunta = (encuestaId: string) => { socket!.emit('poll:hide', { pollId: encuestaId }) }

  // Conectamos el socket a sus handlers
  useEffect(() => {
    if (socket) {
      socket.on('polls:list', setEncuestas)
      socket.on('poll:updated', updateEncuesta)
      socket.on('poll:created', addEncuesta)
      socket.on('poll:deleted', ({ pollId }) => deleteEncuesta(pollId))

      socket.on('poll:error', ({ message }: { message: string }) => {
        toast.error(message)
      })

      socket.on('disconnect', () => { 
        setTimeout(() => setLinkSala(null), 1000)
      })

      // Pedimos la sala al server
      socket.emit('sala:abrir')

      // Suscribimos a su respuesta
      socket.on('sala:abierta', ({ salaId, polls }: { salaId: { id: string } , polls: Encuesta[] }) => {
        toast.info(`Sala abierta, podés compartirla con tus estudiantes!`)
        console.log('Sala abierta', salaId)
        setLinkSala(`https://ludidactas.com/sala/${salaId.id}/`)

        // Al abrir la sala, le pedimos al server la lista de encuestas, por si la sala ya estaba activa
        setEncuestas(polls)
      })

      return () => {
        socket.removeAllListeners('polls:list')
        socket.removeAllListeners('poll:updated')
        socket.removeAllListeners('poll:created')
        socket.removeAllListeners('poll:deleted')
        socket.removeAllListeners('poll:error')
        socket.removeAllListeners('disconnect')
        socket.removeAllListeners('sala:abierta')
      }
    }

  }, [socket])

  return {
    socket,
    conectado,
    conectando,
    error,
    encuestas,
    linkSala,
    enviarPregunta,
    borrarPregunta,
    cerrarPregunta,
    abrirPregunta,
    publicarPregunta,
    esconderPregunta,
  }
}

// Context
const EncuestaAdminContext = createContext<ReturnType<typeof useEncuestaProfeState> | undefined>(undefined)

// Provider - El email viene del server 
export const EncuestaAdminProvider: React.FC<{ email: string; children: React.ReactNode }> = ({ email, children }) => {
  return <EncuestaAdminContext.Provider value={useEncuestaProfeState(email)}>{children}</EncuestaAdminContext.Provider>
}

// Hook para usar el contexto de Encuesta
export const useEncuestaAdmin = () => {
  const context = useContext(EncuestaAdminContext)
  if (!context) {
    throw new Error('Intentando usar useEncuestaAdmin fuera del EncuestaAdminProvider')
  }
  return context
}
