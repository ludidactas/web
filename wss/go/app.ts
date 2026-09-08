import { randomUUID } from 'crypto'
import { io } from '../server'
import { Salas } from '../salas/app'
import {
  desafioSchema,
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

function rivalDe(partida: Partida, userId: string): JugadorPartida {
  return partida.negro.userId === userId ? partida.blanco : partida.negro
}

/** Envía el estado completo de la partida a los sockets unidos a su sala (los dos jugadores). */
export async function broadcastPartida(partida: Partida) {
  const sockets = await io.to(salaGoRoom(partida.salaId, partida.id)).fetchSockets()
  await Promise.all(sockets.map((s) => s.emit('go:partida', partida)))
}

/** Compañeros conectados de la sala (para `userId`), con si están o no disponibles para desafiar (ya en una partida). */
async function calcularRivalesDisponibles(idSala: string, userId: string) {
  const sala = await Salas.get(idSala)
  const estudiantes = await sala.listarEstudiantes()
  const conectados = estudiantes.filter((e) => e.conectado && e.userId !== userId)

  return Promise.all(
    conectados.map(async (e) => {
      const partidaId = await db.getPartidaActiva(idSala, e.userId)
      return { userId: e.userId, nombre: e.nombre, enPartida: partidaId !== null, partidaId }
    })
  )
}

/**
 * Avisa a cada estudiante conectado de la sala que la disponibilidad de rivales cambió (alguien
 * entró o salió de una partida), empujándole su lista recalculada. Se dispara en cada transición que
 * afecta el flag `enPartida` (desafío creado, rechazado, o partida terminada) para que "la sala" se
 * actualice en vivo sin esperar a que cada cliente la vuelva a pedir.
 */
export async function avisarRivalesActualizados(idSala: string) {
  const sockets = await io.in(`sala:${idSala}:estudiantes`).fetchSockets()
  await Promise.all(
    sockets.map(async (s) => {
      const rivales = await calcularRivalesDisponibles(idSala, s.data.session.userId)
      s.emit('go:rivales_actualizados', rivales)
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

  async function desafiar(payload: unknown, nombre: string) {
    const { rivalId, tamaño } = desafioSchema.parse(payload)

    if (rivalId === userId) throw new Error('No podés desafiarte a vos mismo')

    const existente = await miPartida()
    if (existente && existente.estado !== EstadoPartida.Terminada) throw new Error('Ya tenés una partida en curso')

    const sala = await Salas.get(idSala)
    const estudiantes = await sala.listarEstudiantes()
    const rival = estudiantes.find((e) => e.userId === rivalId)
    if (!rival || !rival.conectado) throw new Error('Ese rival no está disponible')
    if (await db.getPartidaActiva(idSala, rivalId)) throw new Error('Ese rival ya está en una partida')

    const id = randomUUID().split('-')[0]
    const partida: Partida = {
      id,
      salaId: idSala,
      tamaño,
      negro: { userId, nombre },
      blanco: { userId: rivalId, nombre: rival.nombre },
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
    await db.setPartidaActiva(idSala, rivalId, id)

    console.log(`🎲 Desafío de Go creado: ${nombre} (negro) vs ${rival.nombre} (blanco), partida ${id}`)

    io.to(`sala:${idSala}:${rivalId}`).emit('go:desafio', partida)
    await avisarRivalesActualizados(idSala)

    return partida
  }

  async function aceptar(payload: unknown) {
    const { partidaId } = partidaIdSchema.parse(payload)
    const partida = await assertPartidaExiste(idSala, partidaId)
    assertEsJugador(partida, userId)
    if (partida.estado !== EstadoPartida.Pendiente) throw new Error('Ese desafío ya no está pendiente')
    if (partida.blanco.userId !== userId) throw new Error('Solo el desafiado puede aceptar')

    partida.estado = EstadoPartida.Jugando
    await db.guardarPartida(partida)
    await broadcastPartida(partida)
    return partida
  }

  async function rechazar(payload: unknown) {
    const { partidaId } = partidaIdSchema.parse(payload)
    const partida = await assertPartidaExiste(idSala, partidaId)
    assertEsJugador(partida, userId)
    if (partida.estado !== EstadoPartida.Pendiente) throw new Error('Ese desafío ya no está pendiente')

    await db.limpiarPartidaActiva(idSala, partida.negro.userId)
    await db.limpiarPartidaActiva(idSala, partida.blanco.userId)

    const otro = rivalDe(partida, userId)
    io.to(`sala:${idSala}:${otro.userId}`).emit('go:desafio_rechazado', { partidaId })
    await avisarRivalesActualizados(idSala)
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

    const otro = rivalDe(partida, userId)
    await finalizar(partida, otro.userId, 'abandono')
    return partida
  }

  return {
    miPartida,
    observar,
    rivalesDisponibles: () => calcularRivalesDisponibles(idSala, userId),
    desafiar,
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
  await avisarRivalesActualizados(partida.salaId)
}
