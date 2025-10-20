
import { Socket } from "socket.io"
import { conErrorHandling } from "../middleware"
import { profeSala } from "../polls/app"
import { SocketConSesion, SocketEstudiante, SocketProfe } from "../session"
import { getEmailProfeDeSala, getEstudiantesEnSala, getSalaById, obtenerOCrearSala } from "./app"

export const handlersSalaProfe = (socket: SocketProfe) => {

  const safe = conErrorHandling(socket)

  if (!socket.data.user.email) throw new Error('Profe sin email en sesión!')

  // Se conectó un profe, le armamos una sala:
  const sala = obtenerOCrearSala(socket)
  const profe = profeSala(sala.profe.email)

  // socket.emit('sala:abierta', { sala: sala.raw(), polls: profe.listarEncuestas(), estudiantes: getEstudiantesEnSala(sala.id) })

  console.log(`🔌 Se conectó profe ${sala.profe.email}, sala ${sala.id}`)

  socket.on('sala:listar_estudiantes', safe(() => {
    socket.emit('sala:estudiantes', getEstudiantesEnSala(sala.id))
  }))

  socket.on('sala:limpar_estudiantes_sala', safe(() => {
    sala.limpiarEstudiantes()
    socket.emit('sala:estudiantes', sala.listarEstudiantes())
  }))

  socket.on('sala:abrir', safe(() => {
    socket.emit('sala:abierta', { sala: sala.raw(), polls: profe.listarEncuestas(), estudiantes: getEstudiantesEnSala(sala.id) })
  }))

  socket.on('disconnect', (reason) => {
    console.log(`❌ Profe ${sala.profe.email} desconectado: ${reason}`)
  })

}

export const handlersSalaEstudiante = (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)

  const user = socket.data.session.nombre
  const sala = getSalaById(idSala)

  console.log(`🧑‍🎓 Estudiante conectado: ${user} (sala ${idSala} de ${getEmailProfeDeSala(idSala)}, socket ${socket.id})`)

  // Notificamos al profe que un estudiante se ha conectado, y lo guardamos en la lista de estudiantes de la sala
  const notificar = safe(() => {
    sala.estudiantes.set(socket.data.session.sessionId, true)
    sala.socketProfe().emit('sala:estudiante_conectado', socket.data.session)
  })
  notificar()

  socket.on('disconnect', safe((reason) => {
    console.log(`❌ Estudiante ${user} desconectado: ${reason}`)
    sala.estudiantes.set(socket.data.session.sessionId, false)
    sala.socketProfe().emit('sala:estudiante_desconectado', { id: socket.data.session.sessionId })
  }))

}

/** Handlers para exponer info pública de la sala */
export const handlersSalaPublico = (socket: Socket, idSala: string) => {
  const safe = conErrorHandling(socket)
  const emitir = safe(() => {
    const sala = getSalaById(idSala)
    const nombre = `de ${sala.profe.nombre ?? sala.profe.email}`
    socket.emit('sala:nombre', nombre)
  })

  emitir()
}

export const handlersAdmin = (socket: SocketConSesion) => {
  console.log(`✅ Admin conectado: ${socket.id}`)

  socket.on('disconnect', (reason) => {
    console.log(`❌ Admin ${socket.id} desconectado: ${reason}`)
  })
}

