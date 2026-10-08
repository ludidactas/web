import { Socket } from 'socket.io'
import { comandosSalaActivaProfe, comandosSalaConfig, comandosSalasGestion } from '../contrato/salas'
import { registrar } from '../contrato/registrar'
import { conErrorHandling } from '../middleware/error-handling'
import * as db from './db'
import { SocketEstudiante, SocketProfe } from '../middleware/roles'
import { SocketConSesion } from '../middleware/session'
import { profeSala } from '../polls/app'
import { handlersEncuestasProfe } from '../polls/handlers'
import { handlersGoProfe } from '../go/handlers'
import { io } from '../server'
import { Sala, Salas } from './app'
import { registrarApertura, registrarSalidaDelProfe } from '../asistencia/seguimiento'
import type { PlanillaCompleta } from '../validators/salas'
import { MAX_LEN_NOMBRE, MetodosLogin } from '../validators/auth'
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
 *
 * La planilla nunca se purga: guarda a todos los que pasaron por la sala (conectados o no), así que
 * no hace falta un "Limpiar" para conservar a los invitados. Si se pasa `minutos`, restringe las filas
 * a los estudiantes que estuvieron conectados en algún momento de la ventana
 * `[ahora - minutos, ahora]` (según el log de asistencia), para acotar la exportación a la clase actual.
 */
async function armarPlanillaCompleta(sala: Sala, minutos?: number): Promise<PlanillaCompleta> {
  const [estudiantesTotales, nombresProvistos, encuestas, asistencia] = await Promise.all([
    sala.listarEstudiantes(),
    sala.listaPermitidos().nombres(),
    profeSala(sala.id).then((profe) => profe.listarEncuestas()),
    sala.intervalosDeConexion(),
  ])

  const estudiantes =
    minutos && minutos > 0
      ? estudiantesTotales.filter((estudiante) => {
          const intervalos = asistencia[estudiante.userId] ?? []
          const corte = Date.now() - minutos * 60_000
          // Un intervalo abierto (fin: null) significa que sigue conectado: siempre entra.
          return intervalos.some((intervalo) => intervalo.fin === null || intervalo.fin >= corte)
        })
      : estudiantesTotales

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
async function handlersSalaActivaProfe(socket: SocketProfe, sala: Sala) {
  socket.data.salaActiva = sala.id
  socket.join([`sala:${sala.id}`, `sala:${sala.id}:profe`, `sala:${sala.id}:${socket.data.session.userId}`])
  console.log(`🔓 Profe ${socket.data.session.email} abrió sala ${sala.id}`)

  registrar(socket, comandosSalaActivaProfe, {
    'sala:actualizar_config': async (config) => {
      await sala.actualizarConfig(config)
      await sala.sanitizar()
      await sala.broadcast('sala:config_actualizada', await sala.config())
    },

    'sala:listar_estudiantes': async () => {
      socket.emit('sala:estudiantes', await sala.listarEstudiantes())
    },

    // Datos crudos para exportar a Excel (el archivo se arma en el cliente); ver `armarPlanillaCompleta`.
    'sala:pedir_planilla_completa': async (minutos) => armarPlanillaCompleta(sala, minutos),

    'sala:permitidos_agregar': async (lista) => {
      await sala.listaPermitidos().agregar(lista)
      await sala.sanitizar()
      await emitirPermitidos(socket, sala)
    },

    'sala:permitidos_remover': async (lista) => {
      await sala.listaPermitidos().remover(lista)
      await sala.sanitizar()
      await emitirPermitidos(socket, sala)
    },

    'sala:permitidos_limpiar': async () => {
      await sala.listaPermitidos().limpiar()
      await emitirPermitidos(socket, sala)
    },

    // Independiente de `permitidos_agregar`: nombra o renombra un DNI ya cargado.
    'sala:permitidos_nombre': async ({ dni, nombre }) => {
      const nombreTrimmed = nombre.trim().slice(0, MAX_LEN_NOMBRE)
      if (!nombreTrimmed) throw new Error('El nombre no puede estar vacío')
      await sala.listaPermitidos().setNombre(dni, nombreTrimmed)
      await emitirPermitidos(socket, sala)
    },

    // Quedan en redis hasta que el FE confirma que las escribió en Drive: un fallo de subida no pierde la clase.
    'sala:asistencias_pendientes': async () => db.getAsistenciasPendientes(sala.id),

    'sala:descartar_asistencias_pendientes': async () => {
      await db.borrarAsistenciasPendientes(sala.id)
    },
  })

  await handlersEncuestasProfe(socket, sala)
  const iniciarGo = await handlersGoProfe(socket, sala.id)
  await iniciarGo()

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
    // Si la sala se estaba por cerrar (el profe se había desconectado y todavía corre la espera
    // previa a evaluar), la clase sigue: se cancela el cierre y se conserva el inicio, porque el log
    // de asistencia es el mismo.
    await registrarApertura(sala.id)
    if (socket.data.salaActiva === sala.id) return emitirAbierta(socket, sala)
    await handlersSalaActivaProfe(socket, sala)
  }

  registrar(socket, comandosSalasGestion, {
    'salas:listar': async () => emitirLista(),

    // El cliente navega a `/salas/[id]`; `emitirLista` refresca las demás pestañas del profe.
    'sala:crear': async ({ config: { listaPermitidos, nombresPermitidos, ...config } }) => {
      await assertPuedeCrearSala(email)

      const sala = await Salas.crear(socket, config)
      if (listaPermitidos.length > 0) await sala.listaPermitidos().agregar(listaPermitidos)
      await Promise.all(
        Object.entries(nombresPermitidos).map(([dni, nombre]) => sala.listaPermitidos().setNombre(dni, nombre))
      )

      console.log(`✅ Sala creada por ${email}: ${sala.id}`)
      await emitirLista()
      return { idSala: sala.id }
    },

    'sala:renombrar': async ({ idSala, nombre }) => {
      await Salas.assertEsDueño(email, idSala)
      const sala = await Salas.get(idSala)
      await sala.actualizarConfig({ nombre: nombre.trim() })
      await sala.broadcast('sala:config_actualizada', await sala.config())
      await emitirLista()
    },

    // Por ack: el cliente confirma que la eliminación ocurrió (ej. no la borró otra pestaña) antes de sacarla de su lista.
    'sala:eliminar': async ({ idSala }) => {
      await Salas.assertEsDueño(email, idSala)
      await Salas.eliminar(email, idSala)
      if (socket.data.salaActiva === idSala) socket.data.salaActiva = undefined
      await emitirLista()
    },

    'sala:abrir': async ({ idSala }) => {
      await Salas.assertEsDueño(email, idSala)
      await abrir(await Salas.get(idSala))
    },
  })

  await emitirLista()

  socket.on('disconnect', (reason) => {
    console.log(`❌ Profe ${email} desconectado: ${reason}`)

    const salaId = socket.data.salaActiva
    if (!salaId) return

    // El chequeo de "al profe le queda otra conexión abierta" es async: si falla preferimos no
    // programar el cierre antes que cerrar una clase que puede seguir viva.
    registrarSalidaDelProfe(salaId, socket.id).catch((e) =>
      console.error(`No se pudo programar el cierre de la sala ${salaId}:`, e)
    )
  })
}

/** Registra los comandos del estudiante y devuelve su init (registro en la planilla, aviso al profe). */
export const handlersSalaEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)

  // Rooms -- la última de estas tres es su 'personal room' para mensajes dirigidos a este cliente en particular (ej: kickeo, cambios que lo afectan, etc.)
  // A esta altura el `userId` ya está resuelto dependiendo el metodo_login de la sala (nombre/DNI/email).
  socket.join([`sala:${idSala}`, `sala:${idSala}:estudiantes`, `sala:${idSala}:${socket.data.session.userId}`])

  const user = socket.data.session.nombre
  // La sala se resuelve en segundo plano: registrar los comandos no espera I/O.
  const salaPendiente = Salas.get(idSala)
  salaPendiente.catch(() => {})

  socket.on(
    'disconnect',
    safe(async (reason) => {
      console.log(`❌ Estudiante ${user} desconectado: ${reason}`)
      const sala = await salaPendiente
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
  registrar(socket, comandosSalaConfig, {
    'sala:pedir_config': async () => {
      socket.emit('sala:config_actualizada', await (await salaPendiente).config())
    },
  })

  // Init de la conexión: lo corre `server.ts` cuando ya están registrados los comandos de todos los grupos.
  return safe(async () => {
    const sala = await salaPendiente
    console.log(`🧑‍🎓 Estudiante conectado: ${user} (sala ${idSala} de ${sala.profe.email}, socket ${socket.id})`)

    // ...lo registramos en la planilla de la sala (persistiendo su sesión) y notificamos al profe.
    await sala.registrarIngreso(socket.data.session)
    await io.to(`sala:${sala.id}:profe`).emit('sala:estudiante_conectado', socket.data.session)

    // Si está en la lista de invitados (solo aplica a salas por DNI), le avisamos con su nombre
    // provisto (si el profe le puso uno) para que el FE muestre el aviso y el toast de bienvenida.
    const config = await sala.config()
    if (config.metodo_login === MetodosLogin.DNI) {
      const { userId } = socket.data.session
      const esInvitado = await sala.listaPermitidos().incluye(userId)
      if (esInvitado) {
        const nombres = await sala.listaPermitidos().nombres()
        socket.emit('sala:invitado', { nombreProvisto: nombres[userId] })
      }
    }
  })
}

/** Handlers para exponer info pública de la sala */
export const handlersSalaPublico = async (socket: Socket, idSala: string) => {
  console.log(`🔍 Cliente público conectado para sala ${idSala} (socket ${socket.id})`)

  // Rooms
  socket.join([`sala:${idSala}`, `sala:${idSala}:publico`])

  // El cliente pide la config explícitamente después de montar sus listeners (evita race condition)
  registrar(socket, comandosSalaConfig, {
    'sala:pedir_config': async () => {
      const sala = await Salas.get(idSala)
      if (!sala) throw new Error(`Sala ${idSala} no existe!`)
      socket.emit('sala:config_actualizada', await sala.config())
    },
  })
}

export const handlersAdmin = async (socket: SocketConSesion) => {
  console.log(`✅ Admin conectado: ${socket.id}`)

  socket.on('disconnect', (reason) => {
    console.log(`❌ Admin ${socket.id} desconectado: ${reason}`)
  })
}
