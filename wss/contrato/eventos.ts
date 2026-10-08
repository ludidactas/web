import type { EventosGo } from './go'
import type { EventosPollsEstudiante, EventosPollsOverlay, EventosPollsProfe } from './polls'
import type { EventosSalaEstudiante, EventosSalaProfe, EventosSalaPublico } from './salas'

// Eventos que el server le emite a cada rol: la unión de los de cada feature. Los sockets del server
// (`SocketProfe`, `SocketEstudiante`) se tipan con estos mapas, así `socket.emit` rechaza un evento que
// ese rol no recibe o un payload que no le corresponde.

/** Todo lo que el server le emite al profe. */
export type EventosProfe = EventosSalaProfe & EventosPollsProfe & EventosGo

/** Todo lo que el server le emite al estudiante. */
export type EventosEstudiante = EventosSalaEstudiante & EventosPollsEstudiante & EventosGo

/** Todo lo que el server le emite al cliente público (overlay incluido). */
export type EventosPublico = EventosSalaPublico & EventosPollsOverlay

type UnionDe<A, B> = { [K in keyof A | keyof B]: (K extends keyof A ? A[K] : never) | (K extends keyof B ? B[K] : never) }

/**
 * Todo lo que el server puede emitir a algún rol: para cada evento, la unión de sus payloads. Tipa
 * las emisiones a rooms (`io.to(room).emit`), donde el destinatario puede ser de cualquier rol.
 */
export type EventosServidorTodos = UnionDe<UnionDe<EventosProfe, EventosEstudiante>, EventosPublico>
