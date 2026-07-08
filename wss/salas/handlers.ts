import { Socket } from 'socket.io'
import { conErrorHandling } from '../middleware/error-handling'
import { SocketEstudiante, SocketProfe } from '../middleware/roles'
import { SocketConSesion } from '../middleware/session'
import { profeSala } from '../polls/app'
import { handlersEncuestasProfe } from '../polls/handlers'
import { io } from '../server'
import { Sala, Salas } from './app'
import { configCreacionSala } from '../validators/salas'
// LÍMITE SUSCRIPCIÓN (desactivado): reactivar junto con la llamada en `sala:crear`.
// import { assertPuedeCrearSala } from '../suscripciones/planes'

/** Emite `sala:abierta` con el estado completo de la sala (config, encuestas, estudiantes, permitidos). */
async function emitirAbierta(socket: SocketProfe, sala: Sala) {
  const profe = await profeSala(sala.id)
  socket.emit('sala:abierta', {
    sala: await sala.raw(),
    polls: await profe.listarEncuestas(),
    estudiantes: await sala.listarEstudiantes(),
    config: await sala.config(),
    listaPermitidos: await sala.listaPermitidos().obtener(),
  })
}

/**
 * OPERACIÓN (sala activa) — registra los listeners de la sala abierta (`sala`), ligados a ella en
 * closure, y emite `sala:abierta`. Se llama recién al abrir una sala (`sala:abrir` / `sala:crear`), no
 * al conectar: en modo gestión estos listeners ni existen. Incluye los de encuestas de esa sala.
 */
async function handlersSalaActivaProfe(socket: SocketProfe, sala: Sala, safe: ReturnType<typeof conErrorHandling>) {
  socket.data.salaActiva = sala.id
  socket.join([`sala:${sala.id}`, `sala:${sala.id}:profe`])
  console.log(`🔓 Profe ${socket.data.session.email} abrió sala ${sala.id}`)

  socket.on(
    'sala:actualizar_config',
    safe(async (payload: unknown) => {
      await sala.actualizarConfig(payload)
      await sala.sanitizar()
      await sala.broadcast('sala:config_actualizada', await sala.config())
    })
  )

  socket.on(
    'sala:listar_estudiantes',
    safe(async () => {
      socket.emit('sala:estudiantes', await sala.listarEstudiantes())
    })
  )

  socket.on(
    'sala:pedir_asistencia',
    safe(async () => {
      socket.emit('sala:asistencia', await sala.asistencia())
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

  // Encuestas de esta sala (ligadas a ella).
  await handlersEncuestasProfe(socket, sala)

  await emitirAbierta(socket, sala)
}

/**
 * GESTIÓN — la conexión del profe es token-only (identidad), sin sala fija. Acá van solo los eventos
 * de gestión (ABM): `salas:listar`, `sala:crear`, `sala:renombrar`, `sala:eliminar`, y `sala:abrir`.
 * Los eventos de operación los engancha `handlersSalaActivaProfe` recién cuando se abre una sala.
 */
export const handlersGestionSalasProfe = async (socket: SocketProfe) => {
  const safe = conErrorHandling(socket)
  const email = socket.data.session.email

  socket.join(`profe:${email}`)

  /** Emite al profe la lista de sus salas (para la pantalla de gestión). */
  const emitirLista = safe(async () => {
    const salas = await Salas.getSalasDeProfe(email)
    socket.emit(
      'salas:lista',
      salas.map((s) => ({ id: s.id, nombre: s.config.nombre }))
    )
  })

  /**
   * Abre una sala en esta conexión. Modelo página-por-sala: una conexión opera UNA sala. Si ya hay
   * otra abierta, se rechaza (para cambiar de sala se reconecta); si es la misma, se re-emite su
   * estado sin re-registrar listeners.
   */
  const abrir = async (sala: Sala) => {
    if (socket.data.salaActiva && socket.data.salaActiva !== sala.id)
      throw new Error('Ya hay una sala abierta en esta conexión. Reconectá para operar otra.')
    if (socket.data.salaActiva === sala.id) return emitirAbierta(socket, sala)
    await handlersSalaActivaProfe(socket, sala, safe)
  }

  socket.on('salas:listar', emitirLista)

  socket.on(
    'sala:crear',
    safe(async (payload: { config?: unknown; listaPermitidos?: unknown }) => {
      // LÍMITE SUSCRIPCIÓN (desactivado): await assertPuedeCrearSala(email)
      const config = configCreacionSala.parse(payload?.config ?? {})
      const lista = Array.isArray(payload?.listaPermitidos) ? (payload.listaPermitidos as string[]) : []

      const sala = await Salas.crear(socket, config)
      if (lista.length > 0) await sala.listaPermitidos().agregar(lista)

      console.log(`✅ Sala creada por ${email}: ${sala.id}`)
      await emitirLista()
      await abrir(sala) // abrimos la nueva para que el cliente navegue a operarla
    })
  )

  socket.on(
    'sala:renombrar',
    safe(async ({ idSala, nombre }: { idSala: string; nombre: string }) => {
      await Salas.assertEsDueño(email, idSala)
      await (await Salas.get(idSala)).actualizarConfig({ nombre: nombre.trim() })
      await emitirLista()
    })
  )

  socket.on(
    'sala:eliminar',
    safe(async ({ idSala }: { idSala: string }) => {
      await Salas.assertEsDueño(email, idSala)
      await Salas.eliminar(email, idSala)
      if (socket.data.salaActiva === idSala) socket.data.salaActiva = undefined
      await emitirLista()
    })
  )

  socket.on(
    'sala:abrir',
    safe(async ({ idSala }: { idSala: string }) => {
      await Salas.assertEsDueño(email, idSala)
      await abrir(await Salas.get(idSala))
    })
  )

  // Estado inicial: la lista de salas del profe.
  await emitirLista()

  socket.on('disconnect', (reason) => {
    console.log(`❌ Profe ${email} desconectado: ${reason}`)
  })
}

export const handlersSalaEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)

  // Rooms -- la última de estas tres es su 'personal room' para mensajes dirigidos a este cliente en particular (ej: kickeo, cambios que lo afectan, etc.)
  // A esta altura el `userId` ya está resuelto dependiendo el metodo_login de la sala (nombre/DNI/email).
  socket.join([`sala:${idSala}`, `sala:${idSala}:estudiantes`, `sala:${idSala}:${socket.data.session.userId}`])

  const user = socket.data.session.nombre
  const sala = await Salas.get(idSala)

  socket.on(
    'disconnect',
    safe(async (reason) => {
      console.log(`❌ Estudiante ${user} desconectado: ${reason}`)
      const { userId } = socket.data.session

      // No tocamos la planilla: el estudiante sigue registrado, solo deja de tener socket vivo.
      // La presencia se deduce de los sockets al listar; acá solo anotamos el evento de asistencia.
      await sala.registrarDesconexion(userId)

      // Solo le avisamos al profe que se desconectó si NO le queda ningún otro socket vivo (ej:
      // sigue conectado desde otra pestaña/clientId). Excluimos el socket actual del chequeo.
      if (!(await sala.sigueConectado(userId, socket.id)))
        await io.to(`sala:${sala.id}:profe`).emit('sala:estudiante_desconectado', { id: userId })
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

    // ...lo registramos en la planilla de la sala (persistiendo su sesión) y notificamos al profe.
    await sala.registrarEstudiante(socket.data.session)
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
