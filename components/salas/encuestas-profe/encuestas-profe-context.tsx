'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useWss } from '@/components/hooks/use-wss'
import { SalaData } from '@/wss/salas/app'
import { Encuesta } from '@/wss/tipos'
import { PasaporteProfe } from '@/wss/validators/auth'
import { CrearEncuesta } from '@/wss/validators/polls'
import { ConfigSala } from '@/wss/validators/salas'
import { Estudiante, useEncuestaStore } from '../encuestas-store'

/** Cose el socket con el state para profe */
const useEncuestaProfeState = (auth: PasaporteProfe) => {
  // El profe recibe el id de la sala del server de ws
  const [linkSala, setLinkSala] = useState<string | null>(null)
  const [configSala, setConfigSala] = useState<ConfigSala | null>(null)

  // El profe se conecta con su email como idSala
  const { socket: socketWssCli, estado: estadoWssCli, error: errorWssCli, WssDebugPanel } = useWss(auth)

  const {
    encuestas,
    estudiantes,
    addEncuesta,
    setEncuestas,
    updateEncuesta,
    deleteEncuesta,
    setEstudiantes,
    addEstudiante,
    estudianteDesconectado,
  } = useEncuestaStore()

  /** Postea al server la acción de crear */
  const enviarPregunta = (pregunta: string, respuestas: string[], admiteAportes = false) =>
    new Promise<void>((res, rej) => {
      const nuevaEncuesta: CrearEncuesta = {
        pregunta,
        opciones: respuestas,
        admiteAportes,
      }

      socketWssCli!.emit('poll:create', nuevaEncuesta, (error?: string) => {
        if (error) rej(error)
        res()
      })
    })

  /** Postea al server la acción de borrar */
  const borrarPregunta = (encuestaId: string) => {
    socketWssCli!.emit('poll:delete', { pollId: encuestaId })
  }

  /** Postea al server la acción de cerrar */
  const cerrarPregunta = (encuestaId: string) => {
    socketWssCli!.emit('poll:close', { pollId: encuestaId })
  }

  /** Postea al server la acción de abrir */
  const abrirPregunta = (encuestaId: string) => {
    socketWssCli!.emit('poll:open', { pollId: encuestaId })
  }

  /** Postea al sever la acción de publicar */
  const publicarPregunta = (encuestaId: string) => {
    socketWssCli!.emit('poll:publish', { pollId: encuestaId })
  }

  /** Postea al sever la acción de publicar */
  const esconderPregunta = (encuestaId: string) => {
    socketWssCli!.emit('poll:hide', { pollId: encuestaId })
  }

  /** Postea al sever la acción de enfocar */
  const enfocarPregunta = (encuestaId: string) => {
    socketWssCli!.emit('poll:focus', { pollId: encuestaId })
  }

  /** Postea al sever la acción de revelar opciones */
  const revelarOpciones = (encuestaId: string) => {
    socketWssCli!.emit('poll:reveal', { pollId: encuestaId })
  }

  /** Postea al sever la acción de desrevelar opciones */
  const desrevelarOpciones = (encuestaId: string) => {
    socketWssCli!.emit('poll:unreveal', { pollId: encuestaId })
  }

  /** Limpia la lista de estudiantes */
  const limpiarEstudiantesSala = () => {
    socketWssCli!.emit('sala:limpar_estudiantes_sala')
  }

  const actualizarConfig = (config: Partial<ConfigSala>) => {
    console.log(`Enviando update de config al server! `, config)
    socketWssCli!.emit('sala:actualizar_config', config)
  }

  // Conectamos el socket a sus handlers
  useEffect(() => {
    if (socketWssCli) {
      socketWssCli.on('polls:list', setEncuestas)
      socketWssCli.on('poll:updated', updateEncuesta)
      socketWssCli.on('poll:created', addEncuesta)
      socketWssCli.on('poll:deleted', ({ pollId }) => deleteEncuesta(pollId))

      socketWssCli.on('wss:error', ({ message }: { message: string }) => {
        toast.error(message)
      })

      socketWssCli.on('disconnect', () => {
        setTimeout(() => setLinkSala(null), 1000)
      })

      // Suscribimos a su respuesta
      socketWssCli.on(
        'sala:abierta',
        ({ sala, polls, estudiantes }: { sala: SalaData; polls: Encuesta[]; estudiantes: Estudiante[] }) => {
          toast.info(`Sala abierta, podés compartirla con tus estudiantes!`)
          setLinkSala(`${process.env.NEXT_PUBLIC_HOST}/sala/${sala.id}/`)

          // Al abrir la sala, le pedimos al server la lista de encuestas y de estudiantes, por si la sala ya estaba activa
          setEncuestas(polls)
          setEstudiantes(estudiantes)
        }
      )

      socketWssCli.on('sala:estudiantes', setEstudiantes)

      socketWssCli.on('sala:estudiante_conectado', (estudiante: Estudiante) => {
        toast.success(`Estudiante conectado: ${estudiante.nombre}`)
        addEstudiante(estudiante)
      })

      socketWssCli.on('sala:estudiante_desconectado', (estudiante: { id: string }) => {
        estudianteDesconectado(estudiante.id)
      })

      socketWssCli.on('sala:config_actualizada', (config: ConfigSala) => {
        toast.success(`Configuración actualizada!`)
        setConfigSala(config)
      })

      // Pedimos la sala y la lista de estudiantes al server
      socketWssCli.emit('sala:abrir')

      return () => {
        socketWssCli.removeAllListeners('polls:list')
        socketWssCli.removeAllListeners('poll:updated')
        socketWssCli.removeAllListeners('poll:created')
        socketWssCli.removeAllListeners('poll:deleted')
        socketWssCli.removeAllListeners('wss:error')
        socketWssCli.removeAllListeners('disconnect')
        socketWssCli.removeAllListeners('sala:abierta')
        socketWssCli.removeAllListeners('sala:estudiantes')
        socketWssCli.removeAllListeners('sala:estudiante_conectado')
        socketWssCli.removeAllListeners('sala:estudiante_desconectado')
      }
    }
  }, [socketWssCli])

  return {
    socket: socketWssCli,
    estado: estadoWssCli,
    error: errorWssCli,
    encuestas,
    linkSala,
    configSala,
    estudiantes,
    enviarPregunta,
    borrarPregunta,
    cerrarPregunta,
    abrirPregunta,
    publicarPregunta,
    esconderPregunta,
    enfocarPregunta,
    limpiarEstudiantesSala,
    actualizarConfig,
    revelarOpciones,
    desrevelarOpciones,
    WssDebugPanel,
  }
}

// Context
const EncuestaProfeContext = createContext<ReturnType<typeof useEncuestaProfeState> | undefined>(undefined)

// Provider - El auth viene del server
export const EncuestaProfeProvider: React.FC<{ auth: PasaporteProfe; children: React.ReactNode }> = ({
  auth,
  children,
}) => {
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
