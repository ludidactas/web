import { Socket } from 'socket.io'
import { conErrorHandling } from '../middleware/error-handling'
import { SocketEstudiante, SocketProfe } from '../middleware/roles'
import { SocketConSesion } from '../middleware/session'
import { profeSala } from '../polls/app'
import { io } from '../server'
import { Salas } from './app'

export const handlersSalaProfe = async (socket: SocketProfe) => {
  const safe = conErrorHandling(socket)

  // Se conectó un profe, le armamos una sala:
  const sala = await Salas.obtenerOCrear(socket)
  const profe = await profeSala(sala.profe.email)

  // // Rooms
  socket.join([`profe:${socket.data.session.email}`, `sala:${sala.id}`, `sala:${sala.id}:profe`])

  console.log(`🔌 Se conectó profe ${sala.profe.email}, sala ${sala.id}`)

  // Listener para actualizar configuración de la sala
  socket.on(
    'sala:actualizar_config',
    safe(async (payload: unknown) => {
      // `actualizarConfig` valida
      await sala.actualizarConfig(payload)

      // Acá si cambia a `pedir_dni`, revocar sesiones inválidas actuales.
      await sala.sanitizar()

      // Notificamos a todos los clientes de la sala que la config se actualizó, enviándoles la nueva config (completa)
      await sala.broadcast('sala:config_actualizada', await sala.config())
    })
  )

  // Listener para lista de estudiantes de la sala
  socket.on(
    'sala:listar_estudiantes',
    safe(async () => {
      socket.emit('sala:estudiantes', await sala.listarEstudiantes())
    })
  )

  // Listener para que el profe pida limpiar la lista de estudiantes sin sesiones activas
  socket.on(
    'sala:limpar_estudiantes_sala',
    safe(async () => {
      await sala.limpiarEstudiantes()
      socket.emit('sala:estudiantes', await sala.listarEstudiantes())
    })
  )

  // Listener para que el profe pida abrir la sala (enviamos en respuesta la info de la sala, encuestas y estudiantes)
  socket.on(
    'sala:abrir',
    safe(async () => {
      socket.emit('sala:abierta', {
        sala: await sala.raw(),
        polls: await profe.listarEncuestas(),
        estudiantes: await sala.listarEstudiantes(),
      })
    })
  )

  // Emitimos de inmediato la info inicial
  const emitir = safe(async () => {
    socket.emit('sala:abierta', {
      sala: await sala.raw(),
      polls: await profe.listarEncuestas(),
      estudiantes: await sala.listarEstudiantes(),
      config: await sala.config(),
    })
  })

  await emitir()

  // Console logueamos la desconexión del profe
  socket.on('disconnect', (reason) => {
    console.log(`❌ Profe ${sala.profe.email} desconectado: ${reason}`)
  })
}

export const handlersSalaEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)

  // Rooms
  socket.join([`sala:${idSala}`, `sala:${idSala}:estudiantes`, `sala:${idSala}:${socket.data.session.userId}`])

  const user = socket.data.session.nombre
  const sala = await Salas.get(idSala)

  socket.on(
    'disconnect',
    safe(async (reason) => {
      console.log(`❌ Estudiante ${user} desconectado: ${reason}`)
      await sala.marcarEstudianteAusente(socket.data.session.userId)
      await io.to(`sala:${sala.id}:profe`).emit('sala:estudiante_desconectado', { id: socket.data.session.userId })
    })
  )

  // El cliente pide la config explícitamente después de montar sus listeners (evita race condition)
  socket.on('sala:pedir_config', safe(async () => {
    socket.emit('sala:config_actualizada', await sala.config())
  }))

  // Al conectarse un estudiante...
  const emitir = safe(async () => {
    console.log(`🧑‍🎓 Estudiante conectado: ${user} (sala ${idSala} de ${sala.profe.email}, socket ${socket.id})`)

    // ...notificamos al profe que un estudiante se ha conectado, y lo guardamos en la lista de estudiantes de la sala
    await sala.marcarEstudiantePresente(socket.data.session.userId)
    await io.to(`sala:${sala.id}:profe`).emit('sala:estudiante_conectado', socket.data.session)
  })
  await emitir()
}

/** Handlers para exponer info pública de la sala */
export const handlersSalaPublico = async (socket: Socket, idSala: string) => {
  console.log(`🔍 Cliente público conectado para sala ${idSala} (socket ${socket.id})`)

  // Rooms
  socket.join([`sala:${idSala}`, `sala:${idSala}:publico`])

  const safe = conErrorHandling(socket)

  // El cliente pide la config explícitamente después de montar sus listeners (evita race condition)
  socket.on('sala:pedir_config', safe(async () => {
    const sala = await Salas.get(idSala)
    if (!sala) throw new Error(`Sala ${idSala} no existe!`)
    socket.emit('sala:config_actualizada', await sala.config())
  }))
}

export const handlersAdmin = async (socket: SocketConSesion) => {
  console.log(`✅ Admin conectado: ${socket.id}`)

  socket.on('disconnect', (reason) => {
    console.log(`❌ Admin ${socket.id} desconectado: ${reason}`)
  })
}
