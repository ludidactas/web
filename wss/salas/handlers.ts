import { Socket } from 'socket.io'
import { conAck, conErrorHandling } from '../middleware/error-handling'
import { SocketEstudiante, SocketProfe } from '../middleware/roles'
import { SocketConSesion } from '../middleware/session'
import { profeSala } from '../polls/app'
import { handlersEncuestasProfe } from '../polls/handlers'
import { io } from '../server'
import { Sala, Salas } from './app'
import { configCreacionSala } from '../validators/salas'
import { MAX_LEN_NOMBRE } from '../validators/auth'
import { assertPuedeCrearSala } from '../suscripciones/planes'

/** Emite `sala:abierta` con el estado completo de la sala (config, encuestas, estudiantes, permitidos). */
async function emitirAbierta(socket: SocketProfe, sala: Sala) {
  const profe = await profeSala(sala.id)
  socket.emit('sala:abierta', {
    sala: await sala.raw(),
    polls: await profe.listarEncuestas(),
    estudiantes: await sala.listarEstudiantes(),
    config: await sala.config(),
    listaPermitidos: await sala.listaPermitidos().obtenerConNombres(),
  })
}

/** Re-emite la lista de invitados (DNIs + nombres provistos) al profe, tras cualquier cambio. */
async function emitirPermitidos(socket: SocketProfe, sala: Sala) {
  socket.emit('sala:lista_permitidos', await sala.listaPermitidos().obtenerConNombres())
}

/**
 * Arma la planilla completa de la sala a partir del estado durable del server: una fila por cada
 * estudiante que pasó por la planilla (conectado o no) y, por cada encuesta, el texto de las
 * opciones que votó. El FE arma el archivo .xlsx a partir de esto (ver `sala:pedir_planilla_completa`).
 */
async function armarPlanillaCompleta(sala: Sala) {
  const [estudiantes, nombresProvistos, encuestas] = await Promise.all([
    sala.listarEstudiantes(),
    sala.listaPermitidos().nombres(),
    profeSala(sala.id).then((profe) => profe.listarEncuestas()),
  ])

  const preguntas = encuestas.map((encuesta) => ({ id: encuesta.id, pregunta: encuesta.pregunta }))

  const filas = estudiantes.map((estudiante) => {
    const respuestas: Record<string, string> = {}
    for (const encuesta of encuestas) {
      const elegidas = encuesta.opciones.filter((opcion) => opcion.votantes.includes(estudiante.userId))
      if (elegidas.length > 0) respuestas[encuesta.id] = elegidas.map((opcion) => opcion.texto).join(', ')
    }

    return {
      ...estudiante,
      nombreProvisto: nombresProvistos[estudiante.userId],
      respuestas,
    }
  })

  return { preguntas, filas }
}

/** OPERACIÓN — listeners de la sala abierta (ligados a `sala`), registrados recién al abrirla. */
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

  // Comando con ack: el profe pide la planilla completa (estado durable del server, no el store
  // del FE) para exportarla a Excel. Devuelve datos crudos; el archivo se arma en el cliente.
  socket.on('sala:pedir_planilla_completa', conAck(socket)(async () => armarPlanillaCompleta(sala)))

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
      await emitirPermitidos(socket, sala)
    })
  )

  socket.on(
    'sala:permitidos_remover',
    safe(async (list: string[]) => {
      await sala.listaPermitidos().remover(list)
      await sala.sanitizar()
      await emitirPermitidos(socket, sala)
    })
  )

  socket.on(
    'sala:permitidos_limpiar',
    safe(async () => {
      await sala.listaPermitidos().limpiar()
      await emitirPermitidos(socket, sala)
    })
  )

  // Nombre que el profe le asigna a un invitado (por DNI) antes de que se conecte. Es independiente
  // del alta en la lista (`permitidos_agregar`): permite ponerle/cambiarle nombre a un DNI ya cargado.
  socket.on(
    'sala:permitidos_nombre',
    safe(async ({ dni, nombre }: { dni: string; nombre: string }) => {
      const nombreTrimmed = nombre.trim().slice(0, MAX_LEN_NOMBRE)
      if (!nombreTrimmed) throw new Error('El nombre no puede estar vacío')
      await sala.listaPermitidos().setNombre(dni, nombreTrimmed)
      await emitirPermitidos(socket, sala)
    })
  )

  await handlersEncuestasProfe(socket, sala)

  await emitirAbierta(socket, sala)
}

/** GESTIÓN (ABM) — token-only, sin sala fija. La operación se engancha al abrir (`handlersSalaActivaProfe`). */
export const handlersGestionSalasProfe = async (socket: SocketProfe) => {
  const safe = conErrorHandling(socket)
  const email = socket.data.session.email

  socket.join(`profe:${email}`)

  /** Emite la lista de salas a todas las conexiones del profe (room `profe:${email}`). */
  const emitirLista = safe(async () => {
    const salas = await Salas.getSalasDeProfe(email)
    io.to(`profe:${email}`).emit(
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

  // Responde por ack con el id de la sala nueva; el cliente navega a `/salas/[id]` para operarla
  // (gestión no abre salas). `emitirLista` refresca el listado en las demás pestañas del profe.
  socket.on(
    'sala:crear',
    conAck(socket)(async (payload: { config?: unknown }) => {
      await assertPuedeCrearSala(email)
      const { listaPermitidos, ...config } = configCreacionSala.parse(payload?.config ?? {})

      const sala = await Salas.crear(socket, config)
      if (listaPermitidos.length > 0) await sala.listaPermitidos().agregar(listaPermitidos)

      console.log(`✅ Sala creada por ${email}: ${sala.id}`)
      await emitirLista()
      return { idSala: sala.id }
    })
  )

  socket.on(
    'sala:renombrar',
    safe(async ({ idSala, nombre }: { idSala: string; nombre: string }) => {
      await Salas.assertEsDueño(email, idSala)
      const sala = await Salas.get(idSala)
      await sala.actualizarConfig({ nombre: nombre.trim() })
      await sala.broadcast('sala:config_actualizada', await sala.config())
      await emitirLista()
    })
  )

  // Responde por ack: el cliente necesita saber si la eliminación realmente ocurrió (ej: sala ya
  // borrada por otra pestaña) antes de sacarla de su lista, en vez de asumir éxito optimistamente.
  socket.on(
    'sala:eliminar',
    conAck(socket)(async ({ idSala }: { idSala: string }) => {
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
