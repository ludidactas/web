import { Server } from "socket.io"
import { conSession, SocketConSesion } from "../session"
import { crearSala, getEmailProfeDeSala, getOrCreateSala, sockets_profes } from "./app"
import { conErrorHandling } from "../middleware"
import { profeSala } from "../polls/app"
import { bradcastPoll } from "../polls/handlers"

export const handlersProfe = (io: Server, socket: SocketConSesion) => { 
  
    const safe = conErrorHandling(socket)
  
    if (!socket.data.user.email) throw new Error('Profe sin email en sesión!')

    // Se conectó un profe, le armamos una sala con su email como key:
    const email = socket.data.user.email!
    const sala = getOrCreateSala(email)
    console.log(`✅ Se conectó profe ${email}, sala ${sala}`)

    const profe = profeSala(sala.id)

    // Al conectarse el profe, le enviamos la lista de encuestas de su sala
    socket.emit('polls:list', profe.listar())

    // All the profe event handlers...
    socket.on('poll:create', safe((poll: unknown) => {
      bradcastPoll(io, sala.id, 'poll:created', profe.crearPoll(poll))
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
      socket.emit('sala:abierta', { salaId: sala, polls: profe.listar() })
    }))

    socket.on('disconnect', (reason) => {
      console.log(`❌ Profe ${email} desconectado: ${reason}`)
      sockets_profes.delete(email)
    })
  
}


export const handlersAdmin =  (io: Server, socket: SocketConSesion) => {
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
  console.log(`🏫 Creating namespace for sala: /polls/${salaId}/estudiante`)

  // Registramos la sala en el servidor (endpoint de estudiantes)
  const estudianteNamespace = io.of(`/polls/${salaId}/estudiante`)
  estudianteNamespace.use(conSession).on('connection', (socket: SocketConSesion) => {

    const user = socket.data.session.nombre

    console.log(`✅ Estudiante conectado: ${user} (sala ${salaId} de ${getEmailProfeDeSala(salaId)})`)

    socket.on('disconnect', (reason) => {
      console.log(`❌ Estudiante ${user} desconectado: ${reason}`)
    })
  })

  // Add error handling for the namespace
  estudianteNamespace.on('connect_error', (error) => {
    console.log(`❌ Error en namespace estudiante ${salaId}:`, error.message)
  })

  // La registramos en la memoria
  crearSala(salaId)
}
