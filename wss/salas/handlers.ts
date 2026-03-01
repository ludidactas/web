import { Socket } from 'socket.io'
import { conErrorHandling } from '../middleware/error-handling'
import { SocketEstudiante, SocketProfe } from '../middleware/roles'
import { SocketConSesion } from '../middleware/session'
import { profeSala } from '../polls/app'
import { getEmailProfeDeSala, getSalaById, obtenerOCrearSala } from './app'

export const handlersSalaProfe = async (socket: SocketProfe) => {
  const safe = conErrorHandling(socket)

  if (!socket.data.session.email) throw new Error('Profe sin email en sesión!')

  // Guardamos el socket del profe en una SALA para poder comunicarnos con él cuando se conecten estudiantes
  socket.join(`profe:${socket.data.session.email}`)

  // Se conectó un profe, le armamos una sala:
  const sala = await obtenerOCrearSala(socket)
  const profe = await profeSala(sala.profe.email)

  socket.emit('sala:abierta', {
    sala: sala.raw(),
    polls: profe.listarEncuestas(),
    estudiantes: sala.listarEstudiantes(),
  })

  console.log(`🔌 Se conectó profe ${sala.profe.email}, sala ${sala.id}`)

  socket.on(
    'sala:actualizar_config',
    safe(async (payload: unknown) => {
      // `actualizarConfig` valida
      await sala.actualizarConfig(payload)

      // Acá si cambia a `pedir_dni`, revocar sesiones inválidas actuales.
      await sala.sanitizar()

      const { config } = await sala.get()

      // Notificamos a todos los clientes de la sala que la config se actualizó, enviándoles la nueva config (completa)
      await sala.broadcast('sala:config_actualizada', config)
    })
  )

  socket.on(
    'sala:listar_estudiantes',
    safe(async () => {
      socket.emit('sala:estudiantes', await sala.listarEstudiantes())
    })
  )

  socket.on(
    'sala:limpar_estudiantes_sala',
    safe(async () => {
      await sala.limpiarEstudiantes()
      socket.emit('sala:estudiantes', await sala.listarEstudiantes())
    })
  )

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

  // Emisión inicial de la config de la sala al profe, para que tenga la config al abrir la sala
  const emitir = safe(async () => {
    socket.emit('sala:config_actualizada', (await sala.get()).config)
  })

  await emitir()

  socket.on('disconnect', (reason) => {
    console.log(`❌ Profe ${sala.profe.email} desconectado: ${reason}`)
  })
}

export const handlersSalaEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)

  // Los joineamos a una sala grupal y a una individual (para rutearle mensajes!)
  socket.join(idSala)
  socket.join(`estudiantes:${idSala}`)
  socket.join(`${idSala}:${socket.data.session.id}`)

  const user = socket.data.session.nombre
  const sala = await getSalaById(idSala)

  console.log(
    `🧑‍🎓 Estudiante conectado: ${user} (sala ${idSala} de ${await getEmailProfeDeSala(idSala)}, socket ${socket.id})`
  )

  // Notificamos al profe que un estudiante se ha conectado, y lo guardamos en la lista de estudiantes de la sala
  const notificar = safe(async () => {
    await sala.marcarEstudiantePresente(socket.data.session.id)

    const socks = await sala.socketsProfe()
    socks.forEach((s) => s.emit('sala:estudiante_conectado', socket.data.session))
  })
  await notificar()

  socket.on(
    'disconnect',
    safe(async (reason) => {
      console.log(`❌ Estudiante ${user} desconectado: ${reason}`)
      await sala.marcarEstudianteAusente(socket.data.session.id)
      const socks = await sala.socketsProfe()
      socks.forEach((s) => s.emit('sala:estudiante_desconectado', { id: socket.data.session.id }))
    })
  )
}

/** Handlers para exponer info pública de la sala */
export const handlersSalaPublico = async (socket: Socket, idSala: string) => {
  console.log(`🔍 Cliente público conectado para sala ${idSala} (socket ${socket.id})`)

  socket.join(idSala)
  socket.join(`publico:${idSala}`)

  const safe = conErrorHandling(socket)
  const emitir = safe(async () => {
    const sala = await getSalaById(idSala)
    if (!sala) throw new Error(`Sala ${idSala} no existe!`)
    socket.emit('sala:config_actualizada', (await sala.get()).config)
  })

  await emitir()
}

export const handlersAdmin = async (socket: SocketConSesion) => {
  console.log(`✅ Admin conectado: ${socket.id}`)

  socket.on('disconnect', (reason) => {
    console.log(`❌ Admin ${socket.id} desconectado: ${reason}`)
  })
}
