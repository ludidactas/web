# Asistencia automática

Registra sola, clase por clase, quién estuvo presente y sube el resultado al Drive del profe, sin que
nadie tenga que acordarse de tomar lista. Está repartida entre `wss/` (el server de salas), `wss-cli/` +
`src/components` (el FE del profe) y `src/server/google` + `src/lib/google` (la integración con Sheets).

## Cómo lo vive el profe

1. Prende el switch "Lista de asistencia" al crear la sala, o después desde su configuración
   (`SelectorCondicionDeAsistencia`), y elige la condición: acumular un mínimo de minutos en toda la
   clase (`total_minutos`), estar conectado los últimos N minutos (`ultimos_minutos`), o alcanza con
   haberse conectado en algún momento (`conectado`, sin umbral de minutos). El umbral en minutos va de
   1 a `MINUTOS_MAXIMOS` (8 h) — sin ese techo, un valor tipeado de más deja la condición imposible de
   cumplir y marca ausente a todo el mundo sin ningún aviso.
2. Abre la sala — eso marca el `inicio` de la clase.
3. Da la clase. Cada conexión/desconexión de un estudiante queda anotada en el mismo log de eventos
   que ya usa la exportación manual de planilla.
4. Se va: cierra la sala, cierra la pestaña, se le corta la conexión. Arranca una espera de gracia de
   20 minutos (`ESPERA_PARA_CERRAR_MS`). Si en ese lapso vuelve a abrir la sala —un refresh, un cambio
   de red, una reconexión— la clase sigue con el mismo `inicio`, como si nada hubiera pasado.
5. Si pasan los 20 minutos sin que vuelva, la clase queda cerrada en ese momento (`fin`) y se evalúa:
   por cada estudiante que pasó por la sala, ¿cumplió la condición configurada dentro de la ventana
   `inicio`–`fin`? El resultado (presente/ausente por estudiante) queda encolado.
6. La próxima vez que el profe abre esa sala, el FE pide lo que quedó pendiente y lo sube a un Google
   Sheet en su Drive (uno por sala, una columna por clase). Recién ahí se descarta la cola.

### Por qué la subida espera a que el profe vuelva a abrir la sala

La escritura en el Sheet necesita las credenciales de Google del profe (`driveRefreshToken`, que vive
en su sesión de Next-Auth — ver `credencialesGoogle` en `src/server/google/cliente.ts`). El server de
salas, donde corre la evaluación, no tiene forma de conseguir esas credenciales: solo el navegador del
profe, autenticado contra la app de Next.js, puede hacer esa llamada. Y para cuando la clase se evalúa
—los 20 minutos de gracia recién vencieron— el profe está, por definición, desconectado. Por eso el
resultado espera en una cola hasta la próxima vez que hay una pestaña suya abierta.

## Cómo está construido

Un pipeline — cada paso alimenta al siguiente:

1. **Log de eventos + intervalos** (`wss/salas/db.ts`, `reconstruirIntervalos` en `evaluacion.ts`):
   conexión/desconexión de cada estudiante, append-only; se reconstruyen los intervalos de conexión al
   leer. Compartido con la exportación manual de planilla (`armarPlanillaCompleta`).
2. **Apertura/cierre de la clase** (`seguimiento.ts`): `registrarApertura`/`registrarSalidaDelProfe`
   llevan el `inicio`/`fin` de la clase en curso (persistido en redis, `RegistroDeClase`) y agendan
   o cancelan su evaluación como un job de bullmq (ver más abajo).
3. **Evaluación de presencia** (`evaluacion.ts`): puro, sin redis ni socket.io. Dados los intervalos de
   un estudiante, la `CondicionAsistencia` de la sala y la ventana real de la clase, decide
   presente/ausente (`estuvoPresente`/`evaluarClase`). Descarta clases más cortas que
   `DURACION_MINIMA_CLASE_MS`.
4. **Cola de pendientes** (`db.encolarAsistencia`/`getAsistenciasPendientes`): la clase evaluada espera
   acá a que el FE la suba.
5. **Subida a Drive** (`wss-cli/handlers/profe-asistencia-handlers.ts` →
   `src/app/api/google/salas/[salaId]/asistencia/route.ts` → `src/server/google/sheets-asistencia.ts`):
   dispara al abrir la sala; el server descarta la cola cuando el FE confirma que la escritura fue
   exitosa (`sala:descartar_asistencias_pendientes`).
6. **Configuración** (`wss/validators/asistencia.ts`, `condicion-asistencia.tsx`): el switch + selects
   del punto 1. Vive en la config de la sala (`configSala.condicion_asistencia`); `null` = apagada.

Nota: quedan tres ventanas de race condition sin cerrar (registrarApertura vs. el Worker, el par write+schedule de registrarSalidaDelProfe, el borrado de borrarAsistenciasPendientes) — cerrarlas pide una transacción redis, y ninguna es alcanzable en el uso real. Las dejamos.

## Por qué bullmq, y cómo funciona

El paso 2 necesita agendar "evaluar esta clase en 20 minutos", poder cancelarlo si el profe vuelve
antes, y que sobreviva un restart del proceso wss sin perder la clase que estaba a mitad de la espera.
bullmq (cola de jobs sobre redis) da los tres a la vez:

- Cada cierre programado es un job cuyo id es el `salaId`: a lo sumo un cierre pendiente por sala, y
  cancelarlo es `queue.getJob(salaId)` + `job.remove()`, sin trackear nada aparte.
- El job vive en redis con `delay: ESPERA_PARA_CERRAR_MS`; un Worker lo procesa cuando vence, llamando
  a `evaluarYEncolarClase`.
- Al arrancar, el Worker retoma los jobs demorados que ya vencieron — un restart del wss en medio de
  la espera de gracia no pierde la clase.
- El job tiene reintentos configurados (`attempts`/`backoff` en `defaultJobOptions`), y
  `evaluarYEncolarClase` borra el `RegistroDeClase` recién al final, después de que todo salió bien:
  un error transitorio a mitad de la evaluación no borra el estado, así que el reintento parte de la
  misma clase intacta en vez de encontrarla ya vacía.

Dos detalles de integración:

- bullmq necesita una conexión –o sea instancia de `ioredis`– ya construida en este runtime (bun). Por eso
  `redisBullMQ` (`wss/redis.ts`) es una conexión aparte de la general —bullmq exige
  `maxRetriesPerRequest: null`— compartida entre la `Queue` y el `Worker`. Una sola conexión alcanza para todos los objetos de bullmq.
- `job.remove()` throwea si el job ya está activo (el Worker le ganó la carrera a la cancelación).
  `cancelarJobDeCierre` atrapa ese error: alcanza con eso, porque `evaluarYEncolarClase` ya resuelve
  el caso con el chequeo de `fin === null`.

## Árbol de archivos

```
wss/asistencia/                        # apertura/cierre + evaluación
  evaluacion.ts                        # reconstruirIntervalos, estuvoPresente, evaluarClase (puro)
  seguimiento.ts                       # registrarApertura/registrarSalidaDelProfe/evaluarYEncolarClase
  __tests__/
    evaluacion.test.ts
    reconstruir-intervalos.test.ts

wss/validators/asistencia.ts           # zod: CondicionAsistencia, AsistenciaDeClase — contrato FE↔server

wss/salas/db.ts                        # persistencia: log de eventos, registro de clase, cola de pendientes
wss/salas/handlers.ts                  # cablea seguimiento.ts a connect/disconnect del profe;
                                        # sala:asistencias_pendientes / sala:descartar_asistencias_pendientes
wss/salas/app.ts                       # Sala.intervalosDeConexion() — compartida con la exportación manual

wss-cli/handlers/profe-asistencia-handlers.ts   # al abrir la sala: pide pendientes, sube a Drive, confirma
wss-cli/providers/wss-profe-context.tsx         # monta/desmonta el handler de arriba

src/components/salas/encuestas-profe/
  condicion-asistencia.tsx             # SelectorCondicionDeAsistencia (switch + selects)
src/app/(herramientas)/salas/salas-page-client.tsx   # lo usa al crear una sala
src/components/salas/encuestas-profe/panel-config-sala.tsx   # lo usa en una sala ya creada

src/app/api/google/salas/[salaId]/asistencia/route.ts   # POST: recibe pendientes, valida integración Google
src/server/google/sheets-asistencia.ts                    # busca/crea el spreadsheet, escribe la tabla P/A
src/lib/google/recursos-asistencia.ts                     # FE → llama a la ruta de arriba
src/lib/google/comun.ts                                    # fetch + DriveNoConectado, compartido con colecciones

integracion/asistencia.test.ts         # pipeline completo contra redis real: evaluación, y que la cola
                                        # de bullmq agenda/cancela el job de cierre correcto
integracion/db-asistencia.test.ts      # funciones de bajo nivel de wss/salas/db.ts
src/server/google/__tests__/sheets-asistencia.test.ts
src/lib/google/__tests__/recursos-asistencia.test.ts
```

## Cosas que confunden fácil

- **Hay dos mecanismos de "asistencia" en la sala, no uno.** El botón "Exportar" de
  `AccionesPlanilla` (`acciones-planilla.tsx`) es manual: el profe elige una ventana en minutos en el
  momento del click y arma un `.xlsx` en el cliente (`wss/salas/handlers.ts::armarPlanillaCompleta`).
  Esta feature es automática y evalúa contra la `CondicionAsistencia` configurada en la sala. Comparten
  el log crudo de eventos y `Sala.intervalosDeConexion()`, pero no comparten estado ni resultado —
  tocar el formato de los intervalos afectaría a ambos.
- **El cierre de una clase es "20 minutos desconectado", no "se desconectó"** — ver "Cómo lo vive el
  profe" arriba. Un refresh o una caída de red breve reconecta solo (`wss-profe-context.tsx`) y cancela
  el cierre pendiente.
- **La fecha de una clase en el Sheet es la del `inicio`, no la del cierre**: el cierre siempre cae
  ~20' después (o más, si el profe estuvo desconectado más tiempo), y puede cruzar la medianoche.
- **`condicion_asistencia: null` = la función está apagada** para esa sala. No evalúa, no encola, no
  escribe nada — distinto de una condición mal configurada, que sí correría pero podría no marcar a
  nadie presente.

## Testing

- Unitarios: `bun test wss` — `evaluacion.test.ts` cubre `estuvoPresente` para las tres formas de
  evaluación, `evaluarClase`, y el schema de `CondicionAsistencia`; `reconstruir-intervalos.test.ts`
  cubre multi-tab y una desconexión que nunca llega (intervalo abierto).
- Integración (contra redis real): `bun test integracion` — `asistencia.test.ts` tiene dos describes
  separados a propósito. El del pipeline completo (eventos → evaluación → cola de pendientes) corre con
  el reloj mockeado (`setSystemTime`) y arma el `RegistroDeClase` escribiéndolo directo en redis, sin
  pasar por `registrarApertura`/`registrarSalidaDelProfe`. El de bullmq (agenda/cancela el job) sí
  llama a esas dos funciones, pero con el reloj real. No se pueden mezclar: bullmq calcula el
  vencimiento de un job demorado con `Date.now()` en el momento de agendarlo, así que con el reloj
  mockeado un delay de 20' resuelve a un timestamp del pasado — cualquier Worker vivo conectado a ese
  redis (el del propio proceso de test, o cualquier otro, como un wss corriendo en dev) lo toma casi al
  instante, evaluando la clase en paralelo con lo que el test ya estaba haciendo a mano. `db-asistencia.test.ts`
  cubre las funciones de bajo nivel.
- Google Sheets: `src/server/google/__tests__/sheets-asistencia.test.ts` (escritura/merge de la tabla)
  y `src/lib/google/__tests__/recursos-asistencia.test.ts` (el fetch del FE).
- **Gap conocido**: nada prueba el circuito completo cliente↔servidor de una reconexión real (el
  profe pierde la conexión de red, el cliente reconecta solo y reemite `sala:abrir`). Lo que está
  probado es la mitad server-side — que `registrarApertura` cancela el cierre pendiente — no la
  reconexión del socket en sí.

## TODO: feedback en vivo de presentismo

Hoy nadie se entera de "quedó presente" mientras la clase está en curso: la evaluación
(`evaluacion.ts`) corre una sola vez, al cierre, y solo alimenta la cola de subida a Sheets. Falta:

- El estudiante tiene que poder ver si está presente, con un toast en el momento en que pasa a
  estarlo — no enterarse recién por el Sheet del profe, días después.
- El profe tiene que poder ver, en vivo, el estado de presentismo por estudiante — hoy
  `item-estudiante.tsx` solo pinta si está _conectado_, no si ya cumplió la condición configurada.

### Arquitectura propuesta: recomputar en el cliente, no evaluar en el server

`evaluacion.ts` es puro (no importa redis ni socket.io, solo tipos) — se puede importar tal cual del
lado del FE y correr `estuvoPresente`/`reconstruirIntervalos` ahí, usando `Date.now()` como `fin`
provisorio de la ventana de clase (el `fin` real no existe todavía mientras la clase sigue abierta).
Esto evita construir un motor de evaluación incremental server-side —con timers por estudiante, sobre
todo para `total_minutos`/`ultimos_minutos`, que pueden cumplirse sin que pase ningún evento discreto
de conexión/desconexión—: la fuente de verdad para el Sheet sigue siendo el batch de `seguimiento.ts`
al cierre; esto es una preview/UX en vivo, no un segundo cálculo oficial, así que un desvío mínimo por
reloj de cliente no rompe nada.

El ciclo de vida de un socket no puede ser la fuente de verdad en ninguno de los dos lados: un
estudiante tiene que poder cambiar de dispositivo, refrescar, abrir una segunda pestaña o recrear el
socket, y que todo siga funcionando por su `userId` en la sala — no por lo que un cliente puntual
recuerda de su propia conexión. Por eso ninguno de los dos arma intervalos localmente: el server es
quien reconstruye (`reconstruirIntervalos`, ya existente) a partir del log persistido, y se los manda
en cada caso:

- **Estudiante**: en el momento de la conexión (mismo lugar donde `wss/salas/handlers.ts` ya appendea
  el evento al log), el server reconstruye los intervalos de ese `userId` y se los manda de vuelta —
  junto con `condicion_asistencia` + `inicio` de la sala— sin importar si es la primera conexión, un
  refresh, un cambio de dispositivo o una segunda pestaña. El cliente no acumula nada entre
  conexiones: en cada `conexion` recibe el estado ya reconstruido, corre `estuvoPresente` con
  `fin: Date.now()` en un tick local (`setInterval` + recompute en `visibilitychange`, para no
  perderse el cruce del umbral si el tab quedó en background) y dispara el toast en la transición
  false→true — mismo patrón que el toast ya existente en `wss-cli/handlers/estudiante-sala-handlers.ts`.
  Vale la pena mandar los intervalos crudos y no un "elapsed" ya interpretado: su significado cambia
  según `forma_evaluacion` (ms totales conectado vs. ms dentro de los últimos N minutos), así que
  precalcularlo en el server duplicaría el branching que ya vive en `estuvoPresente` — mejor que la
  misma función pura decida, del lado del cliente, a partir del mismo array de intervalos para ambos
  roles.
- **Profe**: ya recibe `sala:estudiante_conectado`/`sala:estudiante_desconectado`
  (`wss/salas/handlers.ts`) para saber quién está conectado ahora — para presentismo en vivo hace
  falta el mismo tipo de dato que para el estudiante, pero para todos sus estudiantes a la vez:
  exponer un ack nuevo (patrón conAck) que, al abrir/reconectar la sala, devuelva los intervalos ya
  reconstruidos por estudiante (reusando `reconstruirIntervalos` sobre el log persistido en
  `sala:<id>:asistencia`, `wss/salas/db.ts`), y sumar timestamp a los broadcasts de
  conectado/desconectado para actualizarlos en vivo sin volver a pedir el ack. Extender
  `wss-cli/stores/estudiantes-store.ts` con un campo "presente" (mismo lugar donde ya vive
  "conectado") y pintarlo en `item-estudiante.tsx`.
