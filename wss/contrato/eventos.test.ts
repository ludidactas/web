import { test } from 'bun:test'
import type { DefaultEventsMap, Server } from 'socket.io'
import type { SocketEstudiante, SocketProfe } from '../middleware/roles'
import type { Partida } from '../validators/go'
import type { ListenersDe } from './definir'
import type { EventosServidorTodos } from './eventos'

// Solo se chequea en compilación (`tsc`): las emisiones del server se tipan contra los mapas de eventos.
test('los tipos de emisión del server se chequean en compilación', () => {
  const _chequeos = () => {
    const io = null as unknown as Server<DefaultEventsMap, ListenersDe<EventosServidorTodos>>
    const profe = null as unknown as SocketProfe
    const estudiante = null as unknown as SocketEstudiante
    const partida = null as unknown as Partida

    io.to('sala').emit('go:partida', partida)
    profe.emit('sala:estudiantes', [])
    estudiante.emit('sala:invitado', { nombreProvisto: 'Ana' })

    // @ts-expect-error evento que ningún rol recibe
    io.to('sala').emit('evento:inexistente')
    // @ts-expect-error payload que no corresponde al evento
    profe.emit('go:partida', 123)
    // @ts-expect-error `sala:kick` solo lo recibe el estudiante
    profe.emit('sala:kick', { motivo: 'x' })
  }
})
