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

  // Rooms
  socket.join([`profe:${socket.data.session.email}`, `sala:${sala.id}`, `sala:${sala.id}:profe`])

  console.log(`🔌 Se conectó profe ${sala.profe.email}, sala ${sala.id}`)

  // Listener para actualizar configuración de la sala
  socket.on(
    'sala:actualizar_config',
    safe(async (payload: unknown) => {
      // `actualizarConfig` valida
      await sala.actualizarConfig(payload)

      // También revocamos las sesiones de los estudiantes que no estén en la lista de permitidos (si es que la sala tiene lista de permitidos)

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

  // Funciones de lista de acceso:

  socket.on(
    'sala:permitidos_agregar',
    safe(async (list: string[]) => {
      await sala.listaPermitidos().agregar(list)
      await sala.sanitizar()
      socket.emit('sala:lista_permitidos', await sala.listaPermitidos().obtener())
    })
  )

  socket.on(
    'sala:permitidos_remover',
    safe(async (list: string[]) => {
      await sala.listaPermitidos().remover(list)
      await sala.sanitizar()
      socket.emit('sala:lista_permitidos', await sala.listaPermitidos().obtener())
    })
  )

  socket.on(
    'sala:permitidos_limpiar',
    safe(async () => {
      await sala.listaPermitidos().limpiar()
      socket.emit('sala:lista_permitidos', await sala.listaPermitidos().obtener())
    })
  )

  const emitirApertura = safe(async () => {
    socket.emit('sala:abierta', {
      sala: await sala.raw(),
      polls: await profe.listarEncuestas(),
      estudiantes: await sala.listarEstudiantes(),
      config: await sala.config(),
      listaPermitidos: await sala.listaPermitidos().obtener(),
    })
  })

  // Listener para que el profe pida abrir la sala (enviamos en respuesta la info de la sala, encuestas y estudiantes)
  socket.on('sala:abrir', emitirApertura)

  // Emitimos de inmediato la info inicial
  await emitirApertura()

  // Console logueamos la desconexión del profe
  socket.on('disconnect', (reason) => {
    console.log(`❌ Profe ${sala.profe.email} desconectado: ${reason}`)
  })
}

export const handlersSalaEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)

  // Rooms -- la última de estas tres es su 'personal room' para mensajes dirigidos a este cliente en particular (ej: kickeo, cambios que lo afectan, etc.)
  // A esta altura el `userId` ya está resuelto dependiendo el esquema de auth de la sala (nombre/DNI/email).
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
  socket.on(
    'sala:pedir_config',
    safe(async () => {
      socket.emit('sala:config_actualizada', await sala.config())
    })
  )

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
  socket.on(
    'sala:pedir_config',
    safe(async () => {
      const sala = await Salas.get(idSala)
      if (!sala) throw new Error(`Sala ${idSala} no existe!`)
      socket.emit('sala:config_actualizada', await sala.config())
    })
  )
}

export const handlersAdmin = async (socket: SocketConSesion) => {
  console.log(`✅ Admin conectado: ${socket.id}`)

  socket.on('disconnect', (reason) => {
    console.log(`❌ Admin ${socket.id} desconectado: ${reason}`)
  })
}
