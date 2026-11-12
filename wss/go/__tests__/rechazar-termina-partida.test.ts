import { afterEach, describe, expect, it } from 'bun:test'
import { estudianteGo } from '../app'
import {
  getPartida,
  getPartidaActiva,
  guardarPartida,
  registrarPartida,
  setPartidaActiva,
} from '../db'
import { borrarSala, guardarSala } from '../../salas/db'
import { MetodosLogin } from '../../validators/auth'
import { EstadoPartida, type Partida } from '../../validators/go'
import { CONFIG_DEFAULTS } from '../../validators/overlay'
import type { SalaData } from '../../validators/salas'

function salaData(id: string): SalaData {
  return {
    id,
    profe: { email: `profe-${id}@test.com` },
    config: {
      nombre_profe: 'Profe',
      link: 'x',
      metodo_login: MetodosLogin.Nombre,
      solo_invitados: false,
      overlay: CONFIG_DEFAULTS,
    },
  }
}

function partidaPendiente(salaId: string, negroUserId: string, blancoUserId: string): Partida {
  return {
    id: crypto.randomUUID(),
    salaId,
    tamaño: 9,
    modo: 'partida',
    negro: { userId: negroUserId, nombre: 'Negro' },
    blanco: { userId: blancoUserId, nombre: 'Blanco' },
    tablero: [
      ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ],
    turno: 'N',
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
}

let salaId = ''
let negroUserId = ''
let blancoUserId = ''
let partidaId = ''

async function armarPartidaPendiente() {
  salaId = `test-rechazo-${crypto.randomUUID()}`
  negroUserId = `negro-${crypto.randomUUID()}`
  blancoUserId = `blanco-${crypto.randomUUID()}`

  await guardarSala(salaData(salaId))

  const partida = partidaPendiente(salaId, negroUserId, blancoUserId)
  partidaId = partida.id
  await guardarPartida(partida)
  await registrarPartida(salaId, partidaId)
  await setPartidaActiva(salaId, negroUserId, partidaId)
  await setPartidaActiva(salaId, blancoUserId, partidaId)
}

afterEach(async () => {
  if (salaId) await borrarSala(salaId)
})

describe('rechazar una invitación de Go', () => {
  it('termina la partida sin ganador y limpia los punteros activos', async () => {
    await armarPartidaPendiente()

    await (await estudianteGo(salaId, blancoUserId)).rechazar({ partidaId })

    const partida = await getPartida(salaId, partidaId)
    expect(partida?.estado).toBe('terminada')
    expect(partida?.motivoFin).toBe('abandono')
    expect(partida?.ganadorUserId).toBeNull()
    expect(await getPartidaActiva(salaId, negroUserId)).toBeNull()
    expect(await getPartidaActiva(salaId, blancoUserId)).toBeNull()
  })

  it('aceptar una invitación pendiente la pasa a jugando (el invitado es blanco)', async () => {
    await armarPartidaPendiente()

    await (await estudianteGo(salaId, blancoUserId)).aceptar({ partidaId })

    const partida = await getPartida(salaId, partidaId)
    expect(partida?.estado).toBe('jugando')
  })

  it('rechazar una partida que ya no está pendiente tira el error esperado', async () => {
    await armarPartidaPendiente()

    await (await estudianteGo(salaId, blancoUserId)).aceptar({ partidaId })

    await expect(
      (await estudianteGo(salaId, blancoUserId)).rechazar({ partidaId }),
    ).rejects.toThrow('Esa invitación ya no está pendiente')
  })
})
