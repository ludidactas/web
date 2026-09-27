# Asistencia automática

Registra sola, clase por clase, quién estuvo presente y sube el resultado al Drive del profe, sin que
nadie tenga que acordarse de tomar lista. Está repartida entre `wss/` (el server de salas), `wss-cli/` +
`src/components` (el FE del profe) y `src/server/google` + `src/lib/google` (la integración con Sheets).

## Cómo lo vive el profe

1. Prende el switch "Lista de asistencia" al crear la sala, o después desde su configuración
   (`SelectorCondicionDeAsistencia`), y elige la condición: cuántos minutos mínimos de conexión exige,
   y si cuentan acumulados en toda la clase (`total_minutos`) o solo en el tramo final de la clase
   (`ultimos_minutos`).
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
   llevan el `inicio`/`fin` de la clase en curso (persistido en redis, `db.RegistroDeClase`) y agendan
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

- Unitarios: `bun test wss` — `evaluacion.test.ts` cubre `estuvoPresente` para las dos formas de
  evaluación y `evaluarClase`; `reconstruir-intervalos.test.ts` cubre multi-tab y una desconexión que
  nunca llega (intervalo abierto).
- Integración (contra redis real): `bun test integracion` — `asistencia.test.ts` cubre el pipeline
  completo (apertura → eventos → salida del profe → evaluación → cola de pendientes) y que
  `registrarSalidaDelProfe`/`registrarApertura` agendan/cancelan el job de bullmq correcto. Estos
  últimos corren con el reloj real: bullmq calcula el timestamp de un job demorado con `Date.now()` en
  el momento de agendarlo, y mockearlo dejaría el job vencido desde el vamos — el Worker, que corre de
  verdad en el proceso de test, lo procesaría casi al instante. `db-asistencia.test.ts` cubre las
  funciones de bajo nivel.
- Google Sheets: `src/server/google/__tests__/sheets-asistencia.test.ts` (escritura/merge de la tabla)
  y `src/lib/google/__tests__/recursos-asistencia.test.ts` (el fetch del FE).
- **Gap conocido**: nada prueba el circuito completo cliente↔servidor de una reconexión real (el
  profe pierde la conexión de red, el cliente reconecta solo y reemite `sala:abrir`). Lo que está
  probado es la mitad server-side — que `registrarApertura` cancela el cierre pendiente — no la
  reconexión del socket en sí.
