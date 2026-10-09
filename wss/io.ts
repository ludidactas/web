import { DefaultEventsMap, Server } from 'socket.io'
import type { ListenersDe } from './contrato/definir'
import type { EventosServidorTodos } from './contrato/eventos'

/** El server de socket.io, sin escuchar todavía: `mount` (`wss/mount.ts`) lo pone en marcha. */
export const io = new Server<DefaultEventsMap, ListenersDe<EventosServidorTodos>>({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
