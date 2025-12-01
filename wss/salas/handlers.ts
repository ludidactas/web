
import { Socket } from "socket.io"
import { conErrorHandling } from "../middleware/error-handling"
import { profeSala } from "../polls/app"
import { SocketConSesion } from "../middleware/session"
import { getEmailProfeDeSala, getSalaById, obtenerOCrearSala } from "./app"
import { SocketEstudiante, SocketProfe } from "../middleware/roles"

export const handlersSalaProfe = async (socket: SocketProfe) => {

  const safe = conErrorHandling(socket)

  if (!socket.data.user.email) throw new Error('Profe sin email en sesión!')

  // Se conectó un profe, le armamos una sala:
  const sala = await obtenerOCrearSala(socket)
  const profe = await profeSala(sala.profe.email)

  // socket.emit('sala:abierta', { sala: sala.raw(), polls: profe.listarEncuestas(), estudiantes: getEstudiantesEnSala(sala.id) })

  console.log(`🔌 Se conectó profe ${sala.profe.email}, sala ${sala.id}`)

  socket.on('sala:listar_estudiantes', safe(async () => {
    socket.emit('sala:estudiantes', await sala.listarEstudiantes())
  }))

  socket.on('sala:limpar_estudiantes_sala', safe(async () => {
    await sala.limpiarEstudiantes()
    socket.emit('sala:estudiantes', await sala.listarEstudiantes())
  }))

  socket.on('sala:abrir', safe(async () => {
    socket.emit('sala:abierta', {
      sala: sala.raw(),
      polls: await profe.listarEncuestas(),
      estudiantes: await sala.listarEstudiantes()
    })
  }))

  socket.on('disconnect', (reason) => {
    console.log(`❌ Profe ${sala.profe.email} desconectado: ${reason}`)
  })

}

export const handlersSalaEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)

  const user = socket.data.session.nombre
  const sala = await getSalaById(idSala)

  console.log(`🧑‍🎓 Estudiante conectado: ${user} (sala ${idSala} de ${await getEmailProfeDeSala(idSala)}, socket ${socket.id})`)

  // Notificamos al profe que un estudiante se ha conectado, y lo guardamos en la lista de estudiantes de la sala
  const notificar = safe(async () => {
    await sala.marcarEstudiantePresente(socket.data.session.sessionId)
    sala.socketProfe().emit('sala:estudiante_conectado', socket.data.session)
  })
  await notificar()

  socket.on('disconnect', safe(async (reason) => {
    console.log(`❌ Estudiante ${user} desconectado: ${reason}`)
    await sala.marcarEstudianteAusente(socket.data.session.sessionId)
    sala.socketProfe().emit('sala:estudiante_desconectado', { id: socket.data.session.sessionId })
  }))

}

/** Handlers para exponer info pública de la sala */
export const handlersSalaPublico = async (socket: Socket, idSala: string) => {
  console.log(`🔍 Cliente público conectado para sala ${idSala} (socket ${socket.id})`)
  const safe = conErrorHandling(socket)
  const emitir = safe(async () => {
    const sala = await getSalaById(idSala)
    const nombre = `${sala.profe.nombre ?? sala.profe.email}`
    socket.emit('sala:nombre', nombre)
  })

  await emitir()
}

export const handlersAdmin = async (socket: SocketConSesion) => {
  console.log(`✅ Admin conectado: ${socket.id}`)

  socket.on('disconnect', (reason) => {
    console.log(`❌ Admin ${socket.id} desconectado: ${reason}`)
  })
}

