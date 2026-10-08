import type { EventosGo } from './go'
import type { EventosPollsEstudiante, EventosPollsOverlay, EventosPollsProfe } from './polls'
import type { EventosSalaEstudiante, EventosSalaProfe, EventosSalaPublico } from './salas'

// Eventos server→cliente por rol: tipan `socket.emit` de `SocketProfe`/`SocketEstudiante` (ver docs/contrato-wss.md).

/** Todo lo que el server le emite al profe. */
export type EventosProfe = EventosSalaProfe & EventosPollsProfe & EventosGo

/** Todo lo que el server le emite al estudiante. */
export type EventosEstudiante = EventosSalaEstudiante & EventosPollsEstudiante & EventosGo

/** Todo lo que el server le emite al cliente público (overlay incluido). */
export type EventosPublico = EventosSalaPublico & EventosPollsOverlay

type UnionDe<A, B> = { [K in keyof A | keyof B]: (K extends keyof A ? A[K] : never) | (K extends keyof B ? B[K] : never) }

/** Para cada evento, la unión de sus payloads entre roles: tipa `io.to(room).emit`. */
export type EventosServidorTodos = UnionDe<UnionDe<EventosProfe, EventosEstudiante>, EventosPublico>
