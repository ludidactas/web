import { ExtendedError, Server } from "socket.io"
import { conErrorHandling } from "../middleware"
import { profeSala } from "../polls/app"
import { bradcastPoll, handlersEstudiante } from "../polls/handlers"
import { conSession, SocketConSesion } from "../session"
import { ConfigSala, crearSala, getEmailProfeDeSala, getEstudiantesEnSala, getSalaByEmailProfe, owners_salas, sockets_profes } from "./app"

export const handlersProfe = (io: Server, socket: SocketConSesion) => {

  const safe = conErrorHandling(socket)

  if (!socket.data.user.email) throw new Error('Profe sin email en sesión!')

  // Se conectó un profe, le armamos una sala con su email como key:
  const email = socket.data.user.email!
  const sala = obtenerOCrearSala(io, email, {
    nombre_profe: socket.data.user.nombre || email,
    ...socket.data.config_sala ?? {}
  })

  console.log(`🔌 Se conectó profe ${email}, sala ${sala.id}`)

  const profe = profeSala(email)

  socket.on('sala:listar_estudiantes', safe(() => {
    socket.emit('sala:estudiantes', getEstudiantesEnSala(sala.id))
  }))

  socket.on('sala:limpar_estudiantes_sala', safe(() => {
    sala.limpiarEstudiantes()
    console.log(`Estudiantes limpados, enviado `, sala.listarEstudiantes())
    socket.emit('sala:estudiantes', sala.listarEstudiantes())
  }))

  // All the profe event handlers...
  socket.on('poll:create', safe((poll: unknown, responder: (error?: ExtendedError) => void) => {
    try {
      const nueva = profe.crearPoll(poll)
      bradcastPoll(io, sala.id, 'poll:created', nueva)
      responder()
    } catch (e: any) {
      console.error('Error creando encuesta:', e)
      responder(e.message)
    }
  }))

  socket.on('poll:votantes', safe(({ pollId }) => {
    socket.emit('poll:votantes', { votantes: profe.consultarVotantes({ pollId }) })
  }))

  socket.on('poll:open', safe(({ pollId }) => bradcastPoll(io, sala.id, 'poll:updated', profe.updatePoll(pollId, { isOpen: true }))))
  socket.on('poll:close', safe(({ pollId }) => bradcastPoll(io, sala.id, 'poll:updated', profe.updatePoll(pollId, { isOpen: false }))))
  socket.on('poll:publish', safe(({ pollId }) => bradcastPoll(io, sala.id, 'poll:updated', profe.updatePoll(pollId, { isPublished: true }))))
  socket.on('poll:hide', safe(({ pollId }) => bradcastPoll(io, sala.id, 'poll:updated', profe.updatePoll(pollId, { isPublished: false }))))

  socket.on('poll:delete', safe(({ pollId }) => {
    profe.deletePoll({ pollId })
    broadcastASala(io, sala.id, 'poll:deleted', { pollId })
  }))

  // Guardamos el socket del profe para enviarle notificaciones de su sala
  sockets_profes.set(email, socket)

  socket.on('sala:abrir', safe(() => {
    socket.emit('sala:abierta', { sala, polls: profe.listarEncuestas(), estudiantes: getEstudiantesEnSala(sala.id) })
  }))

  socket.on('disconnect', (reason) => {
    console.log(`❌ Profe ${email} desconectado: ${reason}`)
    sockets_profes.delete(email)
  })

}


export const handlersAdmin = (io: Server, socket: SocketConSesion) => {
  console.log(`✅ Admin conectado: ${socket.id}`)

  socket.on('disconnect', (reason) => {
    console.log(`❌ Admin ${socket.id} desconectado: ${reason}`)
  })
}


/** Envía a admin, profe y estudiantes de la sala */
export const broadcastASala = (io: Server, salaId: string, event: string, data: unknown) => {
  io.of('/polls/admin').emit(event, data)
  sockets_profes.get(getEmailProfeDeSala(salaId))?.emit(event, data)

  io.of(`/polls/${salaId}/estudiante`).sockets.forEach((socketEstudiante) => { socketEstudiante.emit(event, data) })
}


/** Crea y hace el setup del canal para estudiantes de la sala */
export const registrarSala = (io: Server, salaId: string) => {
  console.log(`🏫 Creando namespace para sala: /polls/${salaId}/estudiante`)

  // Registramos la sala en el servidor (endpoint de estudiantes)
  io.of(`/polls/${salaId}/estudiante`).use(conSession)
    .on('connect_error', (error) => { console.log(`❌ Error en /polls/${salaId}/estudiante:`, error.message) })
    .on('connection', (socket: SocketConSesion) => handlersEstudiante(io, socket, salaId))
}

/** Obtiene una sala existente, y si no existe la crea y le asigna un namespace */
export const obtenerOCrearSala = (io: Server, email: string, config: Partial<ConfigSala>) => {
  if (!owners_salas.has(email)) {
    const sala = crearSala(email, config)
    registrarSala(io, sala.id)
    console.log(`✅ Sala creada para profe ${email}: ${sala.id}`)
  }
  return getSalaByEmailProfe(email)!
}