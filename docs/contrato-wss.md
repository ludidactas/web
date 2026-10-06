# Contrato WSS server↔cliente

Los comandos que el cliente le manda al server se declaran **una sola vez**, con el schema zod del
payload. El server registra handlers contra ese contrato y el cliente emite contra el mismo contrato:
renombrar un evento, cambiar un payload o usar `enviar` donde corresponde `pedir` rompe la compilación.

```
wss/contrato/definir.ts     builders (comando, comandoAck, devuelve, sinPayload) y tipos derivados
wss/contrato/registrar.ts   server: valida con zod, ejecuta el handler, responde por ack o `wss:error`
wss/contrato/<feature>.ts   contrato de una feature: comandos por rol + eventos server→cliente
wss-cli/contrato-cli.ts     cliente: `comandos<C>(socket)` → enviar/pedir, `escuchar<E>(socket, {...})`
wss/contrato/registrar.test.ts   test con socket.io real (server + cliente en proceso)
```

## Cómo se declara una feature

```ts
// wss/contrato/<feature>.ts
export const comandosXProfe = {
  'x:borrar': comando(xIdSchema),                              // sin respuesta: error → `wss:error`
  'x:crear': comandoAck(crearXSchema, devuelve<void>()),       // con ack: el cliente usa `pedir`
  'x:listar': comandoAck(sinPayload, devuelve<X[]>()),         // comando sin payload
}
export interface EventosXProfe {                               // lo que el server emite al cliente
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
- El código de init que corre en cada conexión (fuera de un comando) sigue protegido con
  `conErrorHandling(socket)(fn)()`: un throw ahí sin wrapper es una `unhandledRejection` que tira el proceso.

## Cliente

```ts
const cmd = comandos<typeof comandosXProfe>(socket)
cmd.enviar('x:borrar', { xId })              // solo comandos sin ack
const xs = await cmd.pedir('x:listar')       // solo comandos con ack; rechaza con Error(mensaje del server)

let dejar = () => {}
montar:    () => { dejar = escuchar<EventosXProfe>(socket, { 'x:actualizada': store.update }) }
desmontar: () => dejar()                     // quita solo los listeners que registró este módulo
```

## Receta de migración (código viejo → contrato)

| Código viejo | Con el contrato |
| --- | --- |
| `socket.on('ev', safe(async (p) => ...))` | entrada en `registrar(socket, contrato, { 'ev': async (p) => ... })` |
| `socket.on('ev', conAck(socket)(async (p) => ...))` | `comandoAck(schema, devuelve<R>())` + entrada en `registrar` |
| `payload: unknown` + `schema.parse(payload)` dentro del handler/`app.ts` | schema en el contrato; el handler recibe el tipo parseado |
| ack ad hoc (`responder(error?)`) | `comandoAck(..., devuelve<void>())`; el cliente hace `await pedir(...)` |
| `socket.emit('ev', p)` / `socket.timeout(n).emitWithAck(...)` + `if (!res.ok) throw` | `cmd.enviar` / `await cmd.pedir` |
| `socket.on(...)` + `removeAllListeners('ev')` en `desmontar` | `dejar = escuchar<Eventos>(socket, {...})` + `dejar()` |
| request→response con un par de eventos (`emit 'x'` → server `emit 'x'`) | candidato a `comandoAck` + `pedir` |

Al migrar un comando con ack, los llamadores del cliente reciben `Error` (con `.message`), no `string`.

## Estado de la migración

| Feature | Server | Cliente |
| --- | --- | --- |
| Encuestas — profe, estudiante, overlay | ✅ `wss/polls/handlers.ts` | ✅ `wss-cli/handlers/*-encuestas-handlers.ts` |
| Dojo (visitante anónimo) | ✅ `wss/dojo/handlers.ts` | ✅ `src/app/(sitio)/go/dojo/use-sincronizacion-dojo.ts` |
| Go (estudiante y profe) | ⏳ `wss/go/handlers.ts` | ⏳ `estudiante-go-handlers.ts`, `profe-go-handlers.ts` |
| Salas — gestión (ABM) y sala activa del profe | ⏳ `wss/salas/handlers.ts` | ⏳ `profe-gestion-salas-handlers.ts`, `profe-sala-activa-handlers.ts` |
| Salas — estudiante y público | ⏳ | ⏳ `estudiante-sala-handlers.ts`, `public-sala-handlers.ts`, `base-sala-handlers.ts` |
| Asistencia | ⏳ | ⏳ `profe-asistencia-handlers.ts` |

Pendiente transversal, una vez migradas todas las features: tipar los eventos server→cliente en los
sockets del server (`SocketProfe`/`SocketEstudiante`, `io.to(...).emit`, `sala.broadcast`). Hoy están
con `DefaultEventsMap` porque un mapa parcial rechazaría los eventos de las features sin migrar. Cuando
estén todas, retirar `conErrorHandling`/`conAck` sueltos y unificar el tipo `Ack` en `wss/contrato`.

## Eventos sin contraparte detectados al migrar

El contrato deja a la vista los eventos que solo existían de un lado. En encuestas:

- `poll:votantes` (server → profe): ningún cliente lo escucha; no está en el contrato. `consultarVotantes` sigue en `wss/polls/app.ts`.
- `poll:created` (cliente profe y estudiante) y `polls:list` (cliente profe): el server nunca los emite
  (crear y actualizar viajan como `poll:updated`; el profe recibe sus encuestas en `sala:abierta`). Se quitaron los listeners.

## Para quien agrega código en paralelo

Mientras una feature no esté migrada, sus handlers viejos (`safe`, `conAck`, `montar`/`desmontar` a mano)
siguen funcionando: el contrato convive con ellos. Un comando nuevo en una feature **ya migrada** se
agrega al contrato (`wss/contrato/<feature>.ts`) y a `registrar`; el compilador marca el resto.

Al integrar código de una feature migrada que llegó con el patrón viejo, aplicar la receta de arriba:
mover el schema al contrato, borrar el `parse` interno y pasar el handler a `registrar`.

## Detalles que confunden fácil

- Un `undefined` entre los argumentos de un `emit` viaja como `null`. `registrar` lo normaliza a
  `undefined` antes de validar; por eso un comando sin payload usa `sinPayload` (`z.undefined()`).
- `enviar` y `pedir` son excluyentes a nivel de tipos: `enviar` solo acepta comandos sin ack, `pedir`
  solo con ack. Un comando sin ack que falla en el server avisa por `wss:error`, no por una promesa.
- Los componentes pueden pasar el `output` de un schema donde el contrato espera el `input` (los
  defaults de zod son opcionales en la entrada), por eso `CrearEncuesta` (output) se acepta en `pedir`.
- `pedir` espera el ack 5 s. Un comando lento usa su propio emisor: `comandos<C>(socket, { timeoutMs: 10_000 })`.
