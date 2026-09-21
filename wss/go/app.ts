import { randomUUID } from 'crypto'
import { io } from '../server'
import { Salas } from '../salas/app'
import {
  invitacionSchema,
  EstadoPartida,
  jugadaSchema,
  JugadorPartida,
  Partida,
  partidaIdSchema,
  Resultado,
} from '../validators/go'
import { calcularVivos } from './benson'
import * as db from './db'
import * as motor from './motor'

export function salaGoRoom(salaId: string, partidaId: string) {
  return `sala:${salaId}:go:${partidaId}`
}

async function assertPartidaExiste(salaId: string, partidaId: string): Promise<Partida> {
  const partida = await db.getPartida(salaId, partidaId)
  if (!partida) throw new Error('La partida no existe')
  return partida
}

function assertEsJugador(partida: Partida, userId: string) {
  if (partida.negro.userId !== userId && partida.blanco.userId !== userId)
    throw new Error('No sos parte de esta partida')
}

function colorDe(partida: Partida, userId: string): 1 | 2 {
  if (partida.negro.userId === userId) return motor.NEGRO
  if (partida.blanco.userId === userId) return motor.BLANCO
  throw new Error('No sos parte de esta partida')
}

function contrincanteDe(partida: Partida, userId: string): JugadorPartida {
  return partida.negro.userId === userId ? partida.blanco : partida.negro
}

/** Envía el estado completo de la partida a los sockets unidos a su sala (los dos jugadores). */
export async function broadcastPartida(partida: Partida) {
  const sockets = await io.to(salaGoRoom(partida.salaId, partida.id)).fetchSockets()
  await Promise.all(sockets.map((s) => s.emit('go:partida', partida)))
}

/** Estudiantes de la sala más el profe (si está conectado): todas las personas que puede invitar a
 * jugar Go alguien de esa sala, normalizadas a lo mínimo que necesita este archivo (no la sesión
 * completa). El profe juega bajo su email, igual que el resto de su sesión de sala. */
async function personasDeSala(idSala: string) {
  const sala = await Salas.get(idSala)
  const estudiantes = await sala.listarEstudiantes()
  const personas = estudiantes.map((e) => ({ userId: e.userId, nombre: e.nombre, conectado: e.conectado }))

  if (await sala.profeConectado()) {
    personas.push({ userId: sala.profe.email, nombre: sala.profe.nombre ?? sala.profe.email, conectado: true })
  }

  return personas
}

/** Con qué compañeros de `personas` (ya resuelta) puede jugar `userId`: si están o no disponibles
 * para invitar (ya en una partida) y, en ese caso, contra quién (ej: en la lista de participantes). */
async function contrincantesDesde(personas: Awaited<ReturnType<typeof personasDeSala>>, idSala: string, userId: string) {
  const conectados = personas.filter((e) => e.conectado && e.userId !== userId)

  return Promise.all(
    conectados.map(async (e) => {
      const partidaId = await db.getPartidaActiva(idSala, e.userId)
      const partida = partidaId ? await db.getPartida(idSala, partidaId) : null
      const contrincante = partida ? contrincanteDe(partida, e.userId) : null
      return { userId: e.userId, nombre: e.nombre, enPartida: partidaId !== null, partidaId, contrincante }
    })
  )
}

async function calcularContrincantesDisponibles(idSala: string, userId: string) {
  return contrincantesDesde(await personasDeSala(idSala), idSala, userId)
}

/**
 * Avisa a cada estudiante conectado de la sala (y al profe, que también puede invitar) que la
 * disponibilidad de contrincantes cambió (alguien entró o salió de una partida), empujándole su lista
 * recalculada. Se dispara en cada transición que afecta el flag `enPartida` (invitación creada,
 * rechazada, o partida terminada) para que "la sala" se actualice en vivo sin esperar a que cada
 * cliente la vuelva a pedir.
 */
export async function avisarContrincantesActualizados(idSala: string) {
  const sockets = await io.in([`sala:${idSala}:estudiantes`, `sala:${idSala}:profe`]).fetchSockets()
  // Una sola foto de la sala para todos los destinatarios: si la recalculáramos por socket (como antes
  // de sumar al profe), cada destinatario dispara sus propias consultas de conexión (`fetchSockets`) en
  // paralelo, y nada garantiza que las respuestas lleguen en orden — una más vieja podía pisar a una
  // más nueva y dejar a alguien viendo la sala desactualizada.
  const personas = await personasDeSala(idSala)
  await Promise.all(
    sockets.map(async (s) => {
      const contrincantes = await contrincantesDesde(personas, idSala, s.data.session.userId)
      s.emit('go:contrincantes_actualizados', contrincantes)
    })
  )
}

/** Crea un closure para operar las partidas de Go de un estudiante dentro de una sala. */
export async function estudianteGo(idSala: string, userId: string) {
  async function miPartida() {
    const partidaId = await db.getPartidaActiva(idSala, userId)
    if (!partidaId) return null
    return await db.getPartida(idSala, partidaId)
  }

  /** A diferencia del resto de las operaciones, no requiere ser jugador de la partida: cualquier
   * estudiante de la sala puede pedir observarla. */
  async function observar(payload: unknown) {
    const { partidaId } = partidaIdSchema.parse(payload)
    return assertPartidaExiste(idSala, partidaId)
  }

  async function invitar(payload: unknown, nombre: string) {
    const { contrincanteId, tamaño } = invitacionSchema.parse(payload)

    if (contrincanteId === userId) throw new Error('No podés invitarte a vos mismo')

    const existente = await miPartida()
    if (existente && existente.estado !== EstadoPartida.Terminada) throw new Error('Ya tenés una partida en curso')

    const personas = await personasDeSala(idSala)
    const contrincante = personas.find((e) => e.userId === contrincanteId)
    if (!contrincante || !contrincante.conectado) throw new Error('Ese contrincante no está disponible')
    if (await db.getPartidaActiva(idSala, contrincanteId)) throw new Error('Ese contrincante ya está en una partida')

    const id = randomUUID().split('-')[0]
    const partida: Partida = {
      id,
      salaId: idSala,
      tamaño,
      negro: { userId, nombre },
      blanco: { userId: contrincanteId, nombre: contrincante.nombre },
      tablero: motor.tableroVacio(tamaño),
      turno: motor.NEGRO,
      capturasNegras: 0,
      capturasBlancas: 0,
      pases: 0,
      historial: [],
      removidas: null,
      vivo: null,
      confirmaron: { negro: false, blanco: false },
      estado: EstadoPartida.Pendiente,
      resultado: null,
      motivoFin: null,
      ganadorUserId: null,
      creadaEn: new Date().toISOString(),
    }

    await db.guardarPartida(partida)
    await db.registrarPartida(idSala, id)
    await db.setPartidaActiva(idSala, userId, id)
    await db.setPartidaActiva(idSala, contrincanteId, id)

    console.log(`🎲 Invitación de Go creada: ${nombre} (negro) vs ${contrincante.nombre} (blanco), partida ${id}`)

    io.to(`sala:${idSala}:${contrincanteId}`).emit('go:invitacion', partida)
    await avisarContrincantesActualizados(idSala)

    return partida
  }

  async function aceptar(payload: unknown) {
    const { partidaId } = partidaIdSchema.parse(payload)
    const partida = await assertPartidaExiste(idSala, partidaId)
    assertEsJugador(partida, userId)
    if (partida.estado !== EstadoPartida.Pendiente) throw new Error('Esa invitación ya no está pendiente')
    if (partida.blanco.userId !== userId) throw new Error('Solo el invitado puede aceptar')

    partida.estado = EstadoPartida.Jugando
    await db.guardarPartida(partida)
    await broadcastPartida(partida)
    return partida
  }

  async function rechazar(payload: unknown) {
    const { partidaId } = partidaIdSchema.parse(payload)
    const partida = await assertPartidaExiste(idSala, partidaId)
    assertEsJugador(partida, userId)
    if (partida.estado !== EstadoPartida.Pendiente) throw new Error('Esa invitación ya no está pendiente')

    await db.limpiarPartidaActiva(idSala, partida.negro.userId)
    await db.limpiarPartidaActiva(idSala, partida.blanco.userId)

    const otro = contrincanteDe(partida, userId)
    io.to(`sala:${idSala}:${otro.userId}`).emit('go:invitacion_rechazada', { partidaId })
    await avisarContrincantesActualizados(idSala)
  }

  async function jugar(payload: unknown) {
    const { partidaId, x, y } = jugadaSchema.parse(payload)
    const partida = await assertPartidaExiste(idSala, partidaId)
    const color = colorDe(partida, userId)
    if (partida.estado !== EstadoPartida.Jugando) throw new Error('La partida no está en curso')
    if (partida.turno !== color) throw new Error('No es tu turno')

    const historial = new Set(partida.historial)
    const { tablero, capturas } = motor.jugar(partida.tablero, partida.tamaño, x, y, color, historial)

    partida.tablero = tablero
    partida.historial.push(motor.hashTablero(tablero))
    if (color === motor.NEGRO) partida.capturasNegras += capturas
    else partida.capturasBlancas += capturas
    partida.turno = motor.rival(color)
    partida.pases = 0

    await db.guardarPartida(partida)
    await broadcastPartida(partida)
    return partida
  }

  async function pasar(payload: unknown) {
    const { partidaId } = partidaIdSchema.parse(payload)
    const partida = await assertPartidaExiste(idSala, partidaId)
    const color = colorDe(partida, userId)
    if (partida.estado !== EstadoPartida.Jugando) throw new Error('La partida no está en curso')
    if (partida.turno !== color) throw new Error('No es tu turno')

    partida.pases += 1
    partida.turno = motor.rival(color)

    // Dos pases seguidos terminan la fase de juego y arrancan el conteo (marcado de piedras muertas).
    if (partida.pases >= 2) {
      partida.estado = EstadoPartida.Contando
      partida.removidas = partida.tablero.map((fila) => fila.map(() => false))
      // Calculado una sola vez acá: el tablero ya no cambia durante el conteo, solo `removidas`.
      partida.vivo = calcularVivos(partida.tablero, partida.tamaño)
      partida.confirmaron = { negro: false, blanco: false }
    }

    await db.guardarPartida(partida)
    await broadcastPartida(partida)
    return partida
  }

  async function marcarMuerta(payload: unknown) {
    const { partidaId, x, y } = jugadaSchema.parse(payload)
    const partida = await assertPartidaExiste(idSala, partidaId)
    assertEsJugador(partida, userId)
    if (partida.estado !== EstadoPartida.Contando || !partida.removidas) throw new Error('La partida no está en conteo')

    const grupo = motor.grupoEn(partida.tablero, x, y, partida.tamaño)
    if (grupo.length === 0) throw new Error('Ahí no hay ninguna piedra')
    if (partida.vivo?.[y][x]) throw new Error('Ese grupo está incondicionalmente vivo, no se puede marcar como muerto')

    // Toggle: si el grupo ya estaba marcado como muerto, lo restauramos.
    const marcar = !partida.removidas[y][x]
    for (const [gx, gy] of grupo) partida.removidas[gy][gx] = marcar

    // Cualquier cambio en el marcado invalida las confirmaciones previas.
    partida.confirmaron = { negro: false, blanco: false }

    await db.guardarPartida(partida)
    await broadcastPartida(partida)
    return partida
  }

  async function confirmarConteo(payload: unknown) {
    const { partidaId } = partidaIdSchema.parse(payload)
    const partida = await assertPartidaExiste(idSala, partidaId)
    const color = colorDe(partida, userId)
    if (partida.estado !== EstadoPartida.Contando || !partida.removidas) throw new Error('La partida no está en conteo')

    if (color === motor.NEGRO) partida.confirmaron.negro = true
    else partida.confirmaron.blanco = true

    if (partida.confirmaron.negro && partida.confirmaron.blanco) {
      const puntaje = motor.calcularPuntaje(
        partida.tablero,
        partida.tamaño,
        partida.removidas,
        partida.capturasNegras,
        partida.capturasBlancas
      )
      const ganadorUserId =
        puntaje.ganador === 'empate' ? null : puntaje.ganador === 'negro' ? partida.negro.userId : partida.blanco.userId

      await finalizar(partida, ganadorUserId, 'conteo', puntaje)
    } else {
      await db.guardarPartida(partida)
      await broadcastPartida(partida)
    }

    return partida
  }

  async function abandonar(payload: unknown) {
    const { partidaId } = partidaIdSchema.parse(payload)
    const partida = await assertPartidaExiste(idSala, partidaId)
    assertEsJugador(partida, userId)
    if (partida.estado === EstadoPartida.Terminada) throw new Error('La partida ya terminó')

    const otro = contrincanteDe(partida, userId)
    await finalizar(partida, otro.userId, 'abandono')
    return partida
  }

  return {
    miPartida,
    observar,
    contrincantesDisponibles: () => calcularContrincantesDisponibles(idSala, userId),
    invitar,
    aceptar,
    rechazar,
    jugar,
    pasar,
    marcarMuerta,
    confirmarConteo,
    abandonar,
  }
}

/** Cierra una partida: persiste el resultado, limpia punteros de "partida activa" y suma estadísticas. */
async function finalizar(
  partida: Partida,
  ganadorUserId: string | null,
  motivoFin: 'conteo' | 'abandono',
  resultado?: Resultado
) {
  partida.estado = EstadoPartida.Terminada
  partida.motivoFin = motivoFin
  partida.ganadorUserId = ganadorUserId
  if (resultado) partida.resultado = resultado

  await db.guardarPartida(partida)
  await db.limpiarPartidaActiva(partida.salaId, partida.negro.userId)
  await db.limpiarPartidaActiva(partida.salaId, partida.blanco.userId)
  await db.incrementarStats(partida.negro.userId, ganadorUserId === partida.negro.userId)
  await db.incrementarStats(partida.blanco.userId, ganadorUserId === partida.blanco.userId)

  console.log(`🏁 Partida de Go ${partida.id} terminada por ${motivoFin}. Ganador: ${ganadorUserId ?? 'empate'}`)

  await broadcastPartida(partida)
  await avisarContrincantesActualizados(partida.salaId)
}
