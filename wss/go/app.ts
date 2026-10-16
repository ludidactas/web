import { randomUUID } from 'crypto'
import { io } from '../io'
import { rooms } from '../rooms'
import { Salas } from '../salas/app'
import {
  ContrincanteGo,
  EstadoPartida,
  Invitacion,
  Jugada,
  JugadorPartida,
  Partida,
  PartidaIdPayload,
  Resultado,
} from '../validators/go'
import { calcularVivos } from '@/lib/go/benson'
import * as db from './db'
import { conLock } from './lock'
import * as motor from '@/lib/go/motor'

/**
 * Lógica de servidor de una partida de Go: comandos (invitar/aceptar/jugar/pasar/marcarMuerta/
 * confirmarConteo/abandonar/observar), persistidos en Redis (`./db.ts`) bajo un lock por partida
 * (`./lock.ts`) y transmitidos a los sockets de la sala vía `broadcastPartida`. Las reglas del juego
 * en sí (capturas, territorio, vida) vienen de `@/lib/go/motor`/`@/lib/go/benson` — acá solo se
 * orquesta el estado de la partida alrededor de esas funciones puras.
 */

async function assertPartidaExiste(salaId: string, partidaId: string): Promise<Partida> {
  const partida = await db.getPartida(salaId, partidaId)
  if (!partida) throw new Error('La partida no existe')
  return partida
}

function assertEsJugador(partida: Partida, userId: string) {
  if (partida.negro.userId !== userId && partida.blanco.userId !== userId)
    throw new Error('No sos parte de esta partida')
}

function colorDe(partida: Partida, userId: string): motor.Color {
  if (partida.negro.userId === userId) return motor.NEGRO
  if (partida.blanco.userId === userId) return motor.BLANCO
  throw new Error('No sos parte de esta partida')
}

function contrincanteDe(partida: Partida, userId: string): JugadorPartida {
  return partida.negro.userId === userId ? partida.blanco : partida.negro
}

/** Envía el estado completo de la partida a los sockets unidos a su sala (los dos jugadores). */
export async function broadcastPartida(partida: Partida) {
  const sockets = await io.to(rooms.partidaGo(partida.salaId, partida.id)).fetchSockets()
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
async function contrincantesDesde(
  personas: Awaited<ReturnType<typeof personasDeSala>>,
  idSala: string,
  userId: string
): Promise<ContrincanteGo[]> {
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
  const sockets = await io.in([rooms.estudiantes(idSala), rooms.profe(idSala)]).fetchSockets()
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
  async function observar({ partidaId }: PartidaIdPayload) {
    return assertPartidaExiste(idSala, partidaId)
  }

  // `invitar`/`aceptar`/`rechazar` leen y escriben el puntero de "partida activa" de dos usuarios
  // (`db.getPartidaActiva`/`setPartidaActiva`/`limpiarPartidaActiva`) sin transacción de Redis; sin
  // serializarlas, dos invitaciones o una invitación y una aceptación casi simultáneas en la misma sala
  // pueden pisarse ese puntero y dejar a alguien "jugando" una partida distinta de la que apunta su
  // propio puntero. Una única cola por sala alcanza: el volumen de invitar/aceptar en un aula es bajo.
  const conLockInvitaciones = <T>(fn: () => Promise<T>) => conLock(`${idSala}:go:invitaciones`, fn)

  async function invitar({ contrincanteId, tamaño, modo }: Invitacion, nombre: string) {
    return conLockInvitaciones(async () => {
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
        modo,
        negro: { userId, nombre },
        blanco: { userId: contrincanteId, nombre: contrincante.nombre },
        tablero: modo === 'atari' ? motor.tableroAtari(tamaño) : motor.tableroVacio(tamaño),
        turno: motor.NEGRO,
        capturasNegras: 0,
        capturasBlancas: 0,
        pases: 0,
        historial: [],
        ultimaJugada: null,
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

      console.log(
        `🎲 Invitación de Go (${modo}) creada: ${nombre} (negro) vs ${contrincante.nombre} (blanco), partida ${id}`
      )

      io.to(rooms.usuario(idSala, contrincanteId)).emit('go:invitacion', partida)
      await avisarContrincantesActualizados(idSala)

      return partida
    })
  }

  async function aceptar({ partidaId }: PartidaIdPayload) {
    return conLockInvitaciones(async () => {
      const partida = await assertPartidaExiste(idSala, partidaId)
      assertEsJugador(partida, userId)
      if (partida.estado !== EstadoPartida.Pendiente) throw new Error('Esa invitación ya no está pendiente')
      if (partida.blanco.userId !== userId) throw new Error('Solo el invitado puede aceptar')

      partida.estado = EstadoPartida.Jugando
      await db.guardarPartida(partida)
      await broadcastPartida(partida)
      return partida
    })
  }

  async function rechazar({ partidaId }: PartidaIdPayload) {
    return conLockInvitaciones(async () => {
      const partida = await assertPartidaExiste(idSala, partidaId)
      assertEsJugador(partida, userId)
      if (partida.estado !== EstadoPartida.Pendiente) throw new Error('Esa invitación ya no está pendiente')

      await db.limpiarPartidaActiva(idSala, partida.negro.userId)
      await db.limpiarPartidaActiva(idSala, partida.blanco.userId)

      const otro = contrincanteDe(partida, userId)
      io.to(rooms.usuario(idSala, otro.userId)).emit('go:invitacion_rechazada', { partidaId })
      await avisarContrincantesActualizados(idSala)
    })
  }

  async function jugar({ partidaId, fila, columna }: Jugada) {
    return conLock(partidaId, async () => {
      const partida = await assertPartidaExiste(idSala, partidaId)
      const color = colorDe(partida, userId)
      if (partida.estado !== EstadoPartida.Jugando) throw new Error('La partida no está en curso')
      if (partida.turno !== color) throw new Error('No es tu turno')

      const historial = new Set(partida.historial)
      const { tablero, capturas } = motor.jugar(partida.tablero, partida.tamaño, fila, columna, color, historial)

      partida.tablero = tablero
      partida.historial.push(motor.hashTablero(tablero))
      partida.ultimaJugada = { fila, columna }
      if (color === motor.NEGRO) partida.capturasNegras += capturas
      else partida.capturasBlancas += capturas
      partida.turno = motor.rival(color)
      partida.pases = 0

      // Atari Go: la primera captura termina la partida y le da la victoria a quien la hizo.
      if (partida.modo === 'atari' && capturas > 0) {
        await finalizar(partida, userId, 'captura')
        return partida
      }

      await db.guardarPartida(partida)
      await broadcastPartida(partida)
      return partida
    })
  }

  async function pasar({ partidaId }: PartidaIdPayload) {
    return conLock(partidaId, async () => {
      const partida = await assertPartidaExiste(idSala, partidaId)
      const color = colorDe(partida, userId)
      if (partida.estado !== EstadoPartida.Jugando) throw new Error('La partida no está en curso')
      if (partida.turno !== color) throw new Error('No es tu turno')
      if (partida.modo === 'atari') throw new Error('En Atari Go no se puede pasar')

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
    })
  }

  async function marcarMuerta({ partidaId, fila, columna }: Jugada) {
    return conLock(partidaId, async () => {
      const partida = await assertPartidaExiste(idSala, partidaId)
      assertEsJugador(partida, userId)
      if (partida.estado !== EstadoPartida.Contando || !partida.removidas)
        throw new Error('La partida no está en conteo')

      const grupo = motor.grupoEn(partida.tablero, fila, columna, partida.tamaño)
      if (grupo.length === 0) throw new Error('Ahí no hay ninguna piedra')
      if (partida.vivo?.[fila][columna])
        throw new Error('Ese grupo está incondicionalmente vivo, no se puede marcar como muerto')

      // Toggle: si el grupo ya estaba marcado como muerto, lo restauramos.
      const marcar = !partida.removidas[fila][columna]
      for (const [gf, gc] of grupo) partida.removidas[gf][gc] = marcar

      // Cualquier cambio en el marcado invalida las confirmaciones previas.
      partida.confirmaron = { negro: false, blanco: false }

      await db.guardarPartida(partida)
      await broadcastPartida(partida)
      return partida
    })
  }

  async function confirmarConteo({ partidaId }: PartidaIdPayload) {
    return conLock(partidaId, async () => {
      const partida = await assertPartidaExiste(idSala, partidaId)
      const color = colorDe(partida, userId)
      if (partida.estado !== EstadoPartida.Contando || !partida.removidas)
        throw new Error('La partida no está en conteo')

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
          puntaje.ganador === 'empate'
            ? null
            : puntaje.ganador === 'negro'
              ? partida.negro.userId
              : partida.blanco.userId

        await finalizar(partida, ganadorUserId, 'conteo', puntaje)
      } else {
        await db.guardarPartida(partida)
        await broadcastPartida(partida)
      }

      return partida
    })
  }

  async function abandonar({ partidaId }: PartidaIdPayload) {
    return conLock(partidaId, async () => {
      const partida = await assertPartidaExiste(idSala, partidaId)
      assertEsJugador(partida, userId)
      if (partida.estado === EstadoPartida.Terminada) throw new Error('La partida ya terminó')

      const otro = contrincanteDe(partida, userId)
      await finalizar(partida, otro.userId, 'abandono')
      return partida
    })
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
  motivoFin: 'conteo' | 'abandono' | 'captura',
  resultado?: Resultado
) {
  partida.estado = EstadoPartida.Terminada
  partida.motivoFin = motivoFin
  partida.ganadorUserId = ganadorUserId
  if (resultado) partida.resultado = resultado

  await db.guardarPartida(partida)
  await db.limpiarPartidaActiva(partida.salaId, partida.negro.userId)
  await db.limpiarPartidaActiva(partida.salaId, partida.blanco.userId)
  await db.incrementarStats(partida.salaId, partida.negro.userId, ganadorUserId === partida.negro.userId)
  await db.incrementarStats(partida.salaId, partida.blanco.userId, ganadorUserId === partida.blanco.userId)

  console.log(`🏁 Partida de Go ${partida.id} terminada por ${motivoFin}. Ganador: ${ganadorUserId ?? 'empate'}`)

  await broadcastPartida(partida)
  await avisarContrincantesActualizados(partida.salaId)
}
