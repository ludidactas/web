'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CrearEncuesta, Encuesta } from '@/wss/tipos'
import { PasaporteProfe } from '../../../../components/hooks/use-conexion-wss'
import { useServerWebsockets } from '../../../../components/hooks/use-server-encuestas'
import { Estudiante, useEncuestaStore } from './encuestas-store'

/** Cose el socket con el state para profe */
const useEncuestaProfeState = (auth: PasaporteProfe) => {
  // El profe recibe el id de la sala del server de ws
  const [linkSala, setLinkSala] = useState<string | null>(null)

  // El profe se conecta con su email como idSala
  const { socket, estado, error } = useServerWebsockets(auth)
  const {
    encuestas,
    estudiantes,
    addEncuesta,
    setEncuestas,
    updateEncuesta,
    deleteEncuesta,
    addEstudiante,
    removeEstudiante,
    setEstudiantes,
  } = useEncuestaStore()

  /** Postea al server la acción de crear */
  const enviarPregunta = (pregunta: string, respuestas: string[]) => new Promise<void>((res, rej) => {
    const nuevaEncuesta: CrearEncuesta = {
      pregunta,
      opciones: respuestas,
    }

    socket!.emit('poll:create', nuevaEncuesta, (error?: string) => { 
      if (error) rej(error)
      res()
    })
  })

  /** Postea al server la acción de borrar */
  const borrarPregunta = (encuestaId: string) => {
    socket!.emit('poll:delete', { pollId: encuestaId })
  }

  /** Postea al server la acción de cerrar */
  const cerrarPregunta = (encuestaId: string) => {
    socket!.emit('poll:close', { pollId: encuestaId })
  }

  /** Postea al server la acción de abrir */
  const abrirPregunta = (encuestaId: string) => {
    socket!.emit('poll:open', { pollId: encuestaId })
  }

  /** Postea al sever la acción de publicar */
  const publicarPregunta = (encuestaId: string) => {
    socket!.emit('poll:publish', { pollId: encuestaId })
  }

  /** Postea al sever la acción de publicar */
  const esconderPregunta = (encuestaId: string) => {
    socket!.emit('poll:hide', { pollId: encuestaId })
  }

  /** Postea al sever la acción de enfocar */
  const enfocarPregunta = (encuestaId: string) => {
    socket!.emit('poll:focus', { pollId: encuestaId })
  }

  /** Limpia la lista de estudiantes */
  const limpiarEstudiantesSala = () => { 
    socket!.emit('sala:limpar_estudiantes_sala')
  }

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

      // Suscribimos a su respuesta
      socket.on(
        'sala:abierta',
        ({ sala, polls, estudiantes }: { sala: { id: string }; polls: Encuesta[]; estudiantes: Estudiante[] }) => {
          toast.info(`Sala abierta, podés compartirla con tus estudiantes!`)
          setLinkSala(`${process.env.NEXT_PUBLIC_HOST}/sala/${sala.id}/`)

          // Al abrir la sala, le pedimos al server la lista de encuestas y de estudiantes, por si la sala ya estaba activa
          setEncuestas(polls)
          setEstudiantes(estudiantes)
        }
      )

      socket.on('sala:estudiantes', setEstudiantes)

      socket.on('sala:estudiante_conectado', (estudiante: Estudiante) => {
        toast.success(`Estudiante conectado: ${estudiante.nombre}`)
        addEstudiante(estudiante)
      })

      socket.on('sala:estudiante_desconectado', (estudiante: { id: string }) => {
        removeEstudiante(estudiante.id)
      })

      // Pedimos la sala y la lista de estudiantes al server
      socket.emit('sala:abrir')

      return () => {
        socket.removeAllListeners('polls:list')
        socket.removeAllListeners('poll:updated')
        socket.removeAllListeners('poll:created')
        socket.removeAllListeners('poll:deleted')
        socket.removeAllListeners('poll:error')
        socket.removeAllListeners('disconnect')
        socket.removeAllListeners('sala:abierta')
        socket.removeAllListeners('sala:estudiantes')
        socket.removeAllListeners('sala:estudiante_conectado')
        socket.removeAllListeners('sala:estudiante_desconectado')
      }
    }
  }, [socket])

  return {
    socket,
    estado,
    error,
    encuestas,
    linkSala,
    estudiantes,
    enviarPregunta,
    borrarPregunta,
    cerrarPregunta,
    abrirPregunta,
    publicarPregunta,
    esconderPregunta,
    enfocarPregunta,
    limpiarEstudiantesSala,
  }
}

// Context
const EncuestaProfeContext = createContext<ReturnType<typeof useEncuestaProfeState> | undefined>(undefined)

// Provider - El auth viene del server 
export const EncuestaProfeProvider: React.FC<{ auth: PasaporteProfe; children: React.ReactNode }> = ({ auth, children }) => {
  return <EncuestaProfeContext.Provider value={useEncuestaProfeState(auth)}>{children}</EncuestaProfeContext.Provider>
}

// Hook para usar el contexto de Encuesta
export const useEncuestaProfe = () => {
  const context = useContext(EncuestaProfeContext)
  if (!context) {
    throw new Error('Intentando usar useEncuestaAdmin fuera del EncuestaAdminProvider')
  }
  return context
}
