# Contrato WSS server↔cliente

Los comandos que el cliente le manda al server se declaran **una sola vez**, con el schema zod del
payload. El server registra handlers contra ese contrato y el cliente emite contra el mismo contrato:
renombrar un evento, cambiar un payload o usar `enviar` donde corresponde `pedir` rompe la compilación.

```
wss/contrato/definir.ts     builders (comando, comandoAck, devuelve, sinPayload), el tipo `Ack` y tipos derivados
wss/contrato/registrar.ts   server: valida con zod, ejecuta el handler, responde por ack o `wss:error`
wss/contrato/<feature>.ts   contrato de una feature: comandos por rol + eventos server→cliente (polls, salas, dojo, go)
wss/contrato/eventos.ts     eventos por rol (`EventosProfe`, `EventosEstudiante`, `EventosPublico`) y su unión
wss-cli/contrato-cli.ts     cliente: `comandos<C>(socket)` → enviar/pedir, `escuchar<E>(socket, {...})`, `montarTodos(handlers)`
wss/io.ts · wss/mount.ts    el `io` de socket.io y su arranque (listen, cierre ordenado, errores de proceso)
wss/conexion.ts             despacho por rol: los grupos de handlers de cada rol y el orden registrar → init
wss/rooms.ts                nombres de los rooms de socket.io
wss/contrato/*.test.ts      registrar con socket.io real (server + cliente en proceso), schemas de salas, tipos de `emit`
```

## Cómo se declara una feature

```ts
// wss/contrato/<feature>.ts
export const comandosXProfe = {
  'x:borrar': comando(xIdSchema), // sin respuesta: error → `wss:error`
  'x:crear': comandoAck(crearXSchema, devuelve<void>()), // con ack: el cliente usa `pedir`
  'x:listar': comandoAck(sinPayload, devuelve<X[]>()), // comando sin payload
}
export interface EventosXProfe {
  // lo que el server emite al cliente
  'x:actualizada': X
}
```

- Un contrato por **rol** (profe / estudiante / overlay): el server solo acepta los comandos de su rol.
- Los schemas de payload viven en `wss/validators/` (la fuente de verdad ya existente); el contrato los referencia.
- Los eventos server→cliente son un mapa `{evento: payload}` por rol, porque el payload cambia según
  quién lo recibe (p. ej. la encuesta hidratada es distinta para profe y estudiante).

## Server

```ts
registrar(socket, comandosXProfe, {
  'x:borrar': async ({ xId }) => { ... },       // payload ya parseado por zod
  'x:crear': async (datos) => { ... },          // el retorno viaja en `Ack<R>`
})
```

- El payload llega validado y tipado: los métodos de `app.ts` reciben el tipo parseado, no `unknown`.
- Si el cliente mandó callback de ack, el resultado o el error vuelven por ahí; si no, el error va por
  `wss:error`. Un solo wrapper cubre ambos casos.
- Los errores de zod se resumen con `extractZodErrorMessages` (mensajes legibles, no el JSON de zod).
- `registrar` deja los listeners puestos al retornar: llamarlo **antes** de cualquier `await` de I/O de
  la conexión evita perder comandos que el cliente emite apenas conecta.
- Nada de lo que corre en una conexión puede tirar el proceso (una `unhandledRejection` lo hace, ver
  `wss/mount.ts`): los comandos van por `registrar`, el `disconnect` por `alDesconectar(socket, fn)`, y
  `server.ts` corre `conectar` (el armado de la conexión, `conexion.ts`) dentro de `protegido(socket, fn)`, que
  también envuelve cada init. En los tres un error se loguea y se notifica por `wss:error`.
- Dentro de un handler, un error es la respuesta del comando. Un efecto que viene **después** de que la
  operación principal ya se hizo (refrescar `salas:lista` tras `sala:crear`, el init de Go al abrir una sala)
  se corre con `protegido` a propósito: si fallara sin él, el cliente vería "no se pudo crear" sobre una sala
  que existe (y reintentaría), o el profe nunca recibiría `sala:abierta`. Qué cuenta como secundario depende
  de la operación; `registrar` no puede decidirlo.

## Eventos server→cliente

`wss/contrato/eventos.ts` reúne los eventos de cada feature por rol. Con eso:

- `SocketProfe` y `SocketEstudiante` tipan `socket.emit`: rechaza un evento que ese rol no recibe o un
  payload que no le corresponde.
- El `io` de `wss/mount.ts` tipa `io.to(room).emit` con `EventosServidorTodos`: para cada evento, la unión
  de sus payloads entre roles (el destinatario de un room puede ser de cualquier rol).
- `sala.broadcast(evento, data)` manda el mismo payload a todos los roles (solo eventos que los tres reciben).
  Si el payload depende de quién lo recibe, `sala.broadcastPorRol(evento, { profe, estudiante, publico })`
  pide uno por rol, cada uno del tipo que ese rol recibe (p. ej. `poll:updated`, ver `broadcastPoll`).

Un evento nuevo se declara en la interfaz `Eventos<Feature><Rol>` de su contrato; `eventos.test.ts` fija con
`@ts-expect-error` lo que el compilador debe rechazar.

## Cliente

```ts
const cmd = comandos<typeof comandosXProfe>(socket)
cmd.enviar('x:borrar', { xId }) // solo comandos sin ack
const xs = await cmd.pedir('x:listar') // solo comandos con ack; rechaza con Error(mensaje del server)

// En el handler del cliente: `montar` devuelve cómo desmontarlo (`escuchar` quita solo los listeners de este módulo)
montar: (() => escuchar<EventosXProfe>(socket, { 'x:actualizada': store.update }),
  // En el provider: monta todos los handlers y devuelve el desmontaje de todos
  useEffect(() => montarTodos(handlers), [handlers]))
```

## Receta de migración (código viejo → contrato)

| Código viejo                                                                           | Con el contrato                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `socket.on('ev', safe(async (p) => ...))` (wrapper que loguea y avisa por `wss:error`) | entrada en `registrar(socket, contrato, { 'ev': async (p) => ... })`      |
| `socket.on('ev', conAck(socket)(async (p) => ...))`                                    | `comandoAck(schema, devuelve<R>())` + entrada en `registrar`              |
| `payload: unknown` + `schema.parse(payload)` dentro del handler/`app.ts`               | schema en el contrato; el handler recibe el tipo parseado                 |
| ack ad hoc (`responder(error?)`)                                                       | `comandoAck(..., devuelve<void>())`; el cliente hace `await pedir(...)`   |
| `socket.emit('ev', p)` / `socket.timeout(n).emitWithAck(...)` + `if (!res.ok) throw`   | `cmd.enviar` / `await cmd.pedir`                                          |
| `socket.on(...)` + `removeAllListeners('ev')` en `desmontar`                           | `montar: () => escuchar<Eventos>(socket, {...})` (devuelve el desmontaje) |
| request→response con un par de eventos (`emit 'x'` → server `emit 'x'`)                | candidato a `comandoAck` + `pedir`                                        |

Al migrar un comando con ack, los llamadores del cliente reciben `Error` (con `.message`), no `string`.

## Estado de la migración

| Feature                                                                             | Server                  | Cliente                                                                                                                    |
| ----------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Encuestas — profe, estudiante, overlay                                              | `wss/polls/handlers.ts` | `wss-cli/handlers/*-encuestas-handlers.ts`                                                                                 |
| Dojo (visitante anónimo)                                                            | `wss/dojo/handlers.ts`  | `src/app/(sitio)/go/dojo/use-sincronizacion-dojo.ts`                                                                       |
| Go — estudiante y profe                                                             | `wss/go/handlers.ts`    | `wss-cli/handlers/go-handlers.ts` (compartido por `estudiante-go-handlers.ts` y `profe-go-handlers.ts`)                    |
| Salas — gestión (ABM), sala activa del profe, estudiante y público                  | `wss/salas/handlers.ts` | `profe-gestion-salas-handlers.ts`, `profe-sala-activa-handlers.ts`, `estudiante-sala-handlers.ts`, `base-sala-handlers.ts` |
| Asistencia (`sala:asistencias_pendientes`, `sala:descartar_asistencias_pendientes`) | `wss/salas/handlers.ts` | `profe-asistencia-handlers.ts`                                                                                             |

Todos los comandos del cliente pasan por el contrato y el código de conexión por `alDesconectar` y `protegido`.
Solo el `connect_error` del middleware y los `disconnect` que manejan sus propios errores (profe, admin) se registran a mano.

## Eventos sin contraparte

El contrato deja a la vista los eventos que existen de un solo lado. Estos no tienen contraparte y no están en él:

- `poll:votantes`: sin listener en ningún cliente. `consultarVotantes` (`wss/polls/app.ts`) no tiene llamadores.
- `poll:created` y `polls:list` hacia el profe: el server no los emite (crear y actualizar viajan como
  `poll:updated`; el profe recibe sus encuestas en `sala:abierta`).
- `sala:limpar_estudiantes_sala` y `sala:pedir_asistencia`: el server no los atiende.
- `sala:eliminada`: el server no lo emite (al eliminar una sala los estudiantes reciben `sala:kick`).
- `sala:consultar_nombre_disponible` (`consultarNombreDisponible` en `public-sala-handlers.ts`): el server no lo
  implementa; queda fuera del contrato hasta que exista el comando.
- `sala:pedir_config` lo emite también el profe (`base-sala-handlers.ts`), pero el server solo lo atiende para
  estudiante y público; el profe recibe su config en `sala:abierta`.

## Para quien agrega código en paralelo

Un comando nuevo se agrega al contrato de su feature (`wss/contrato/<feature>.ts`) y a `registrar`; un evento
nuevo, a la interfaz de eventos de ese contrato. El compilador marca el resto: handler faltante del server,
payload mal formado en el cliente, `enviar` donde corresponde `pedir`.

Si llega código con `socket.on` + `safe`/`conAck`, `payload: unknown` con `.parse` adentro o
`montar`/`desmontar` con `removeAllListeners`, se convierte con la receta de arriba: mover el schema al
contrato, borrar el `parse` interno y pasar el handler a `registrar`.

## Detalles que confunden fácil

- Un `undefined` entre los argumentos de un `emit` viaja como `null`. `registrar` lo normaliza a
  `undefined` antes de validar; por eso un comando sin payload usa `sinPayload` (`z.undefined()`).
- `enviar` y `pedir` son excluyentes a nivel de tipos: `enviar` solo acepta comandos sin ack, `pedir`
  solo con ack. Un comando sin ack que falla en el server avisa por `wss:error`, no por una promesa.
- Los componentes pueden pasar el `output` de un schema donde el contrato espera el `input` (los
  defaults de zod son opcionales en la entrada), por eso `CrearEncuesta` (output) se acepta en `pedir`.
- `pedir` espera el ack 5 s. Un comando lento usa su propio emisor: `comandos<C>(socket, { timeoutMs: 10_000 })`.
- Un comando que el cliente emite apenas conecta se pierde si su handler se registra después de un `await` de
  I/O. Por eso los grupos de handlers del estudiante (`handlersSalaEstudiante`, `handlersEncuestasEstudiante`,
  `handlersGoEstudiante`) registran sus comandos sin esperar nada (la sala se resuelve en segundo plano y el
  handler la espera) y devuelven su init; `conexion.ts` corre los init recién cuando todos los grupos están
  registrados. `integracion/registro-temprano.test.ts` lo fija.
- Los comandos de Go del profe se registran al abrir la sala (`sala:abrir`), y el cliente monta Go antes:
  `go:mi_partida` se pide con reintentos.
- Los comandos que devuelven la `Partida` por ack no esperan el broadcast `go:partida`: el socket recién se une
  a la sala de la partida (`seguir`) después de que el server responde.
