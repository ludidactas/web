# Progreso del dojo

El dojo de Go (`/go/dojo`) es público: sin sala ni login. Cada visitante recibe un id anónimo emitido
por el server, y su progreso (desafíos resueltos y desafío actual de cada capítulo) se guarda bajo ese id
en Redis y en localStorage.

## Cómo lo vive el visitante

1. Abre `/go/dojo`. Si el navegador ya tiene un id, retoma su progreso; si no, el server le asigna uno.
2. Resuelve desafíos. El avance queda en el navegador y en Redis.
3. "Enlace a tu progreso" copia `/go/dojo?id=<idDojo>`. Abrir ese enlace en otro dispositivo retoma el
   mismo progreso, y lo que ya había en ese navegador se suma a él.
4. Si el WSS no responde, el dojo sigue funcionando con localStorage.

## Cómo está construido

**Conexión.** El navegador usa el `handshake` de `wss-cli` con el pasaporte `{ rol: 'dojo', idDojo? }`
(`PasaporteDojoSchema`) y `reconnection: true`. El dispatcher de `wss/server.ts` le cablea `handlersDojo`
sin sesión.

**Identidad.** El id son 32 hex al azar que solo emite el server y registra en `dojo:<idDojo>:creado`.
Al conectar, el server toma el `idDojo` del pasaporte si lo emitió él, o genera uno nuevo. El comando
`dojo:identificarse` devuelve el id definitivo; el navegador lo guarda en localStorage (`go-dojo-id`) y en
`socket.auth`, así las reconexiones lo presentan.

**Comandos** (todos responden por ack, ver `wss/contrato/dojo.ts`):

| Comando | Efecto |
|---|---|
| `dojo:identificarse` | devuelve el id definitivo |
| `dojo:sincronizar` | suma los resueltos locales del capítulo y devuelve `{ resueltos, actual }` |
| `dojo:resuelto` | agrega un desafío resuelto |
| `dojo:actual` | guarda el desafío abierto por última vez |

Cada comando espera a que termine la resolución del id, así que se aplican en cualquier orden respecto de
`dojo:identificarse`, incluidos los que el cliente acumula mientras está desconectado.

**Capítulo.** La unidad de progreso es `{ coleccion, capitulo }` (`COLECCION_OGS` = `ogs`). Los slugs de
capítulo son únicos dentro de una colección.

**Merge.** Al cargar un capítulo, el cliente envía `dojo:sincronizar` y combina la respuesta con lo local
(`fusionarProgreso`). Resolver es lo único que modifica `resueltos`, así que la unión nunca pierde nada.
Para `actual` gana el del server; después, cada cambio local lo reemplaza.

**Carga inicial.** `useProgresoDojo` mantiene `cargado` en false hasta tener la respuesta de la
sincronización (`esperando` cubre el tramo previo a tener id). La tarjeta del desafío queda oculta hasta
entonces y aparece en el desafío guardado. La espera tiene un tope de 5 s; si la conexión falla antes,
el dojo sigue con lo local.

## Claves de Redis

| Clave | Tipo | Contenido |
|---|---|---|
| `dojo:<idDojo>:creado` | STRING | timestamp de creación del id |
| `dojo:<idDojo>:resueltos:<coleccion>:<capitulo>` | ZSET | desafíos resueltos; score = timestamp de la primera resolución |
| `dojo:<idDojo>:actual` | HASH | `<coleccion>:<capitulo>` → id del desafío abierto por última vez |

Análisis de uso: `SCAN dojo:*:resueltos:*` + `ZRANGE ... WITHSCORES` da resueltos por capítulo y
desafío con fecha; `dojo:*:creado` da cuándo apareció cada visitante.

## Archivos

```
wss/dojo/
  handlers.ts                          # handlersDojo: comandos dojo:*
  db.ts                                # claves dojo:<idDojo>:... en Redis
  __tests__/validators.test.ts
wss/validators/dojo.ts                 # zod de los payloads y formato del id
wss/validators/auth.ts                 # PasaporteDojoSchema
wss-cli/utils-socket-wss.ts            # handshake
src/app/(sitio)/go/dojo/
  use-sincronizacion-dojo.ts           # conexión, id del visitante, SincronizacionDojo
  contenido.tsx                        # enlace a tu progreso
src/lib/go-dojo/
  progreso.ts                          # fusionarProgreso
  components/use-progreso-dojo.ts      # progreso en localStorage + sincronización remota
integracion/db-dojo.test.ts            # contra Redis
integracion/dojo-handlers.test.ts      # contra Redis
```

## Cosas que confunden fácil

- **`SincronizacionDojo` es una interfaz de `go-dojo`**; la implementa `use-sincronizacion-dojo.ts` en la
  ruta. `src/lib/go-dojo` no importa nada de red.
- **El id de `?id=` sale de la URL al leerlo** y se guarda enseguida en localStorage, así una segunda
  corrida del efecto (StrictMode) lo encuentra.
- **El formato del id (32 hex) se valida en el cliente y en el server**; un pasaporte con un id inválido
  rechaza la conexión.
- **Las escrituras (`dojo:resuelto`, `dojo:actual`) loguean si fallan.** Lo que no llega queda en
  localStorage y sube en el próximo `dojo:sincronizar` del capítulo; `actual` se vuelve a enviar al
  cambiar de desafío.
- **El rechazo de la identificación se atrapa** en `handlersDojo`: `mount.ts` termina el proceso ante un
  `unhandledRejection`.

## Límites conocidos, aceptados

- Cualquiera puede pedir ids nuevos y escribir progreso en ellos. Lo acotan los límites de payload
  (`wss/validators/dojo.ts`); el volumen esperado no justifica un rate limit.
- Quien tenga el enlace con el id ve y modifica ese progreso: el id es la única credencial.
- Las claves `dojo:*` no vencen y no cuelgan de ninguna sala, así que borrar salas no las limpia.
- Abrir el enlace de otra persona suma el progreso local de ese navegador al de ese id.
