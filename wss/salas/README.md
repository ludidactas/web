# Salas

Una sala es el espacio de una clase: el profe la crea, los estudiantes entran por un link, y alrededor
de ella viven las encuestas, el Go multijugador, la asistencia y la planilla. Este módulo (`wss/salas/`)
es dueño de la sala en sí: su configuración, quién es cada estudiante y quién puede entrar, su ciclo
de vida y la planilla de quienes pasaron por ella.

Lo que cuelga de la sala tiene su propio doc: [asistencia automática](../asistencia/README.md),
[contrato WSS](../../docs/contrato-wss.md), [versionado de redis](../../docs/versionado-redis.md).

## Cómo lo vive cada uno

**El profe** crea una sala eligiendo dos cosas que ya no cambian: cómo se **identifican** los
estudiantes y a quién **admite** la sala. Después la abre, da la clase, mira la planilla en vivo y
exporta la planilla completa a Excel. La sala se puede renombrar y eliminar; si pasa un año sin uso, el
server la borra sola.

**El estudiante** abre el link, la sala le pide lo que su identidad requiere (un nombre, un DNI o
iniciar sesión con Google) y entra. Si la sala tiene lista y figura en ella, la sala le avisa que se le
tomó asistencia, con el nombre que le puso el profe si le puso uno.

## Identidad y acceso

Dos ejes independientes, que el profe elige al crear la sala. Ninguno de los dos se cambia después:
una sala `google` sigue siendo `google`, una `lista` sigue siendo `lista`. Quien necesite otra
combinación crea otra sala (las encuestas se exportan e importan entre salas).

### Identidad — `config.metodo_login`

Cómo se identifica el estudiante. Determina qué es su `userId`, la clave que lo identifica en la
planilla, la asistencia y los votos.

| Valor    | Qué pide el estudiante     | `userId`  | Garantía                                                                             |
| -------- | -------------------------- | --------- | ------------------------------------------------------------------------------------ |
| `nombre` | un nombre                  | el nombre | El nombre es único en la sala (comparado normalizado), así que no hay colisiones.    |
| `dni`    | un DNI y, opcional, nombre | el DNI    | Se confía en que cada quien ingresa su propio DNI. Nadie lo verifica.                |
| `google` | iniciar sesión con Google  | el email  | El server verifica el token firmado por Next: el email es de quien inició sesión.    |

### Acceso — `config.acceso`

Qué hace la sala con la lista y con quien no figura en ella.

| Valor       | Quién entra   | Qué hace con la lista                                                           |
| ----------- | ------------- | ------------------------------------------------------------------------------- |
| `libre`     | cualquiera    | Pide y registra el dato de identidad. No hay lista.                             |
| `invitados` | cualquiera    | Anota como invitados a quienes figuran en la lista, con su nombre provisto.     |
| `lista`     | solo la lista | Igual que `invitados`, y rechaza (o expulsa) a quien no figura en la lista.     |

Las tres identidades admiten los tres accesos: nueve combinaciones. Con identidad `nombre`, la lista
reparte nombres de antemano: quien ingresa con un nombre de la lista entra como ese invitado, y en
`lista` el nombre funciona como una contraseña rústica (ver "Cosas que confunden fácil").

### Cómo se elige (FE)

Al crear la sala, cada eje es una fila de tres tarjetas toggle con ícono, título y descripción. Elegir una
deselecciona las otras dos de su fila. Con la sala ya creada, el panel de configuración muestra la
identidad y el acceso elegidos como dato de solo lectura.

## La lista

Cada entrada es una **identidad** (nombre, DNI o email, según `metodo_login`) y, opcionalmente, el
**nombre provisto** que le dio el profe. La lista es lo único de la política de acceso que se puede
editar con la sala en marcha.

- **Normalización.** El DNI se guarda solo con dígitos; el email, en minúsculas y sin espacios; el
  nombre, tal como se escribió con los espacios colapsados. La pertenencia a la lista y los duplicados
  se resuelven comparando normalizado (`normalizarTexto` para los nombres: sin tildes ni mayúsculas).
- **Validación.** El server rechaza las entradas que no tienen la forma de la identidad de la sala (DNI
  no numérico, email mal formado, nombre vacío o de más de `MAX_LEN_NOMBRE`). El FE las filtra antes de
  mandarlas (formulario y CSV); la barrera es la del server.
- **Nombre provisto.** Es una anotación del profe sobre la entrada: no reemplaza el nombre que el
  estudiante declara o trae de Google. La planilla muestra ambos.
- **CSV.** Una columna con la identidad (`nombre`, `dni` o `email`, según la sala) y otra `nombre
  provisto`, en cualquier orden. Detecta el encabezado y acepta `,` y `;` como separador.
- **Editar.** Agregar, quitar o limpiar rige al instante. En una sala `lista`, quien deja de figurar y
  está conectado recibe `sala:kick`; en `invitados` y `libre` ninguna edición expulsa a nadie.
- **Quién la ve.** Solo el profe. El estudiante recibe únicamente `sala:invitado` con su propio nombre
  provisto.

### Liberar un nombre (identidad `nombre`)

El primer dispositivo que ingresa con un nombre lo reserva en la sala. Si quien lo reservó pierde su
dispositivo o su storage, el profe puede **liberar el nombre** (`sala:liberar_nombre`) desde la fila del
estudiante en la planilla:

- Quita la reserva: el próximo que ingrese con ese nombre lo reclama, desde cualquier dispositivo.
- Si el nombre está conectado en ese momento, expulsa esa conexión (`sala:kick`).
- En `lista`, liberar no saca el nombre de la lista: solo habilita a reclamarlo de nuevo.
- Por defecto conserva todo lo asociado al nombre (votos, asistencia, fila de la planilla), que pasa a
  quien lo reclame después. Con `borrarDatos: true` además lo borra, para que quien reclame el nombre
  parta de cero (por ejemplo, otra persona con el mismo nombre).

Payload: `{ nombre, borrarDatos?: boolean }`, con `borrarDatos` en `false` por defecto.

Con `borrarDatos` se borra, para ese `userId`: su fila de la planilla, sus votos en las encuestas, sus
datos en las demás apps de la sala y sus eventos del log de asistencia. No toca lo que ya salió de la
sala: las clases ya evaluadas y las planillas ya escritas en Drive quedan como están.

**FE.** La acción "Liberar nombre" está en la fila del estudiante, con un tooltip: "Libera este nombre
para que otra persona o dispositivo pueda usarlo. Si está conectado, se lo desconecta." Al hacer clic
se abre un diálogo de confirmación con un checkbox, desmarcado por defecto: "Borrar también sus votos
y su asistencia". El texto del checkbox aclara que el borrado no se puede deshacer.

## Qué pasa al ingresar

```
estudiante ──pasaporte──▶ login ──▶ sesión (userId según la identidad)
                                      │
                                      ▼
                        verificarYAutorizarAccesoEstudianteASala
                          nombre libre en la sala (identidad nombre)
                          figura en la lista (acceso lista)
                                      │
                                      ▼
                        registrarIngreso: planilla + log de asistencia
                        sala:invitado si figura en la lista (invitados y lista)
```

El pasaporte lo manda el cliente, pero la identidad la impone la sala: el cliente manda los campos que
la sala le pidió y el server construye la sesión contra el schema de ese `metodo_login`
(`wss/validators/auth.ts`, `session.ts`).

## La config de la sala

`configSala` (`wss/validators/salas.ts`) es el documento que se guarda en redis dentro de la sala.

| Campo                   | Quién lo fija     | Mutable | Qué es                                                          |
| ----------------------- | ----------------- | :-----: | --------------------------------------------------------------- |
| `metodo_login`          | profe, al crear   |   no    | Eje de identidad.                                               |
| `acceso`                | profe, al crear   |   no    | Eje de acceso.                                                  |
| `nombre`                | profe             |   sí    | Nombre de la sala (`sala:renombrar` o `sala:actualizar_config`).|
| `condicion_asistencia`  | profe             |   sí    | Cuándo cuenta como presente; `null` apaga la asistencia automática. |
| `overlay`               | profe             |   sí    | Configuración del overlay de estadísticas para transmisiones.   |
| `guardar_partidas_drive`| profe             |   sí    | Guardar las partidas de Go en el Drive del profe.               |
| `nombre_profe`, `link`  | server            |   no    | Datos derivados al crear.                                       |

`sala:actualizar_config` solo acepta los campos mutables. Un campo inmutable en el payload se rechaza.

## Ciclo de vida

- **Crear** (`sala:crear`). Exige que el profe no haya alcanzado el máximo de salas de su plan
  (`wss/suscripciones/planes.ts`). El id lo genera el server. La lista inicial y sus nombres viajan en
  el mismo comando.
- **Abrir** (`sala:abrir`). Solo el dueño. Una conexión opera **una** sala: para cambiar de sala se
  reconecta. Abrir marca el inicio de la clase y emite `sala:abierta` con todo el estado (config,
  encuestas, planilla, lista). Los comandos de operación se registran recién al abrir.
- **Renombrar** y **eliminar**. Solo el dueño; "no es tuya" se responde como "no existe". Eliminar
  expulsa a los conectados y borra la sala con todas sus claves.
- **Retención** (`retencion.ts`). Una vez por día, un job de bullmq recorre las salas y elimina las que
  llevan 365 días sin uso. Se considera uso abrir la sala y registrar el ingreso de un estudiante.
  A una sala sin fecha de actividad se le marca la de hoy.

## Planilla y exportación

La planilla es el registro durable de **quiénes pasaron por la sala**: una fila por estudiante, conectado
o no, con la sesión con la que ingresó. Persiste hasta que la sala se elimina o vence, así que no hace
falta un "limpiar" para conservar a nadie. La presencia (`conectado`) se deduce de los sockets vivos al
listar, no se guarda.

La **exportación a Excel** es la salida principal de la sala (`sala:pedir_planilla_completa`):

1. El server arma `PlanillaCompleta`: las preguntas de las encuestas y, por cada estudiante, el texto
   de las opciones que votó (`armarPlanillaCompleta` en `handlers.ts`). En `invitados` y `lista`
   suma una fila por cada entrada de la lista que nunca pasó por la sala: sin nombre ni respuestas, con
   `asistió: no`.
2. El FE genera el `.xlsx` (`exportarPlanillaCompleta` en `src/lib/utils.ts`). Columnas: `ID` (DNI,
   email o nombre), `Nombre` (salvo identidad `nombre`, donde sería redundante), `Nombre provisto` y
   `Asistió` (Sí/No) cuando el acceso usa lista, y una columna por pregunta.
3. El profe puede acotarla a una **ventana de minutos** hacia atrás: entran solo quienes estuvieron
   conectados en algún momento de `[ahora − minutos, ahora]` según el log de asistencia. Un intervalo
   abierto (sigue conectado) siempre entra. Los de la lista que no estuvieron en esa ventana figuran
   igual, como `Asistió: No`.

La **asistencia automática** (presente/ausente por clase, subida a un Google Sheet) usa el mismo log de
conexiones; está documentada en [`wss/asistencia/README.md`](../asistencia/README.md).

## Comandos y eventos

Contrato completo en `wss/contrato/salas.ts`.

**Gestión del profe** (valen desde que conecta): `salas:listar`, `sala:crear` (ack: `{ idSala }`),
`sala:renombrar`, `sala:eliminar` (ack), `sala:abrir`.

**Sala abierta del profe**: `sala:actualizar_config`, `sala:listar_estudiantes`,
`sala:pedir_planilla_completa` (ack), `sala:permitidos_agregar`, `sala:permitidos_remover`,
`sala:permitidos_limpiar`, `sala:permitidos_nombre`, `sala:liberar_nombre`,
`sala:asistencias_pendientes` (ack),
`sala:descartar_asistencias_pendientes` (ack).

**Estudiante y público**: `sala:pedir_config`.

**Eventos**: `sala:config_actualizada` (todos), `salas:lista`, `sala:abierta`, `sala:estudiantes`,
`sala:estudiante_conectado`, `sala:estudiante_desconectado`, `sala:lista_permitidos` (profe);
`sala:kick`, `sala:invitado` (estudiante).

## Qué se guarda en redis

| Clave                                 | Tipo   | Contenido                                                             |
| ------------------------------------- | ------ | --------------------------------------------------------------------- |
| `salas`                               | hash   | `id → sala` (documento versionado: `salaCodec`)                       |
| `profe:<email>:salas`, `salas_owners` | set, hash | Índice profe → salas e inverso sala → dueño                        |
| `sala:<id>:estudiantes`               | hash   | `userId → sesión` de la planilla                                      |
| `sala:<id>:allowed_list`              | set    | Identidades de la lista                                               |
| `sala:<id>:allowed_names`             | hash   | `identidad → nombre provisto`                                         |
| `sala:<id>:asistencia`                | lista  | Log append-only de conexión/desconexión                               |
| `sala:<id>:asistencia_pendiente`      | lista  | Clases evaluadas que esperan subirse a Drive                          |
| `sala:<id>:registro_clase`            | string | Inicio/fin de la clase en curso                                       |
| `sala:<id>:ultima_actividad`          | string | Epoch ms del último uso, para la retención                            |

Todas las claves `sala:<id>:*` se borran juntas con la sala (`borrarSala`, por SCAN). Encuestas, votos
y partidas de Go también cuelgan de ese prefijo.

## Rooms de socket.io

Los nombres se arman en un solo lugar, `wss/rooms.ts`. Una conexión de estudiante entra a `sala`,
`estudiantes` y su room personal `usuario` (para mensajes dirigidos a una persona, como el kick); el
profe, a `sala`, `profe` y `cuentaProfe` (todas sus conexiones, en cualquier sala).

## Árbol de archivos

```
wss/salas/
  app.ts          Sala (get/crear/eliminar…): broadcast, planilla, presencia, config, sanitizar
  db.ts           redis: sala, planilla, asistencia, índices profe↔sala, actividad
  handlers.ts     comandos de gestión y de la sala abierta; ingreso del estudiante; planilla completa
  retencion.ts    barrido diario de salas sin uso (bullmq)
  utils.ts        nombres de fantasía para estudiantes por DNI que no ponen nombre
wss/invitados/    la lista: set de identidades + hash de nombres provistos
wss/validators/   salas.ts (config), auth.ts (pasaporte), session.ts (sesión por identidad)
wss/middleware/   session.ts (login), auth.ts (política de acceso)
wss/suscripciones/planes.ts   límite de salas por plan
wss/contrato/salas.ts         comandos y eventos
```

## Cosas que confunden fácil

- **El `metodo_login` y el `acceso` no se cambian.** Elegir mal se arregla creando otra sala. La lista sí
  es editable, y es lo único que la política de acceso permite tocar con la sala en marcha.
- **Una sala `invitados` con la lista vacía admite a todos y no anota a nadie**; se distingue de `libre`
  porque es la intención del profe, no por el comportamiento.
- **Cada persona reclama su nombre.** En identidad `nombre`, el primer `clientId` que ingresa con un
  nombre lo reserva en esa sala (el registro de la planilla lo conserva aunque se desconecte); otra
  persona con el mismo nombre recibe `NombreEnUso`. Combinado con `lista`, el nombre funciona como una
  contraseña: quien lo conozca lo puede reclamar primero. Quien pierde su `clientId` (otro dispositivo,
  storage borrado) recupera su nombre cuando el profe lo libera (ver "Liberar un nombre"). Si en cambio
  el nombre pasa a otra persona, el profe libera con `borrarDatos` para que no herede los votos y la
  asistencia del anterior.
- **El nombre de Google no viene del navegador del estudiante.** Viaja dentro del token que firma Next
  (`src/server/token_wss.ts`) y el server lo decodea; el FE no manda nombre propio en las salas `google`.
- **Google da identidad verificada, no autorización.** El email verificado impide hacerse pasar por otra
  persona de la lista; no impide que alguien comparta su cuenta.
- **El DNI no se verifica.** En una sala `dni` + `lista`, quien conozca el DNI de un invitado puede
  ingresar como él. Es un límite aceptado: la identidad por DNI confía en quien lo escribe. Para una
  garantía más fuerte, la identidad es `google`.
- **`sala:invitado` llega al conectarse.** Quien ya estaba conectado cuando el profe lo sumó a la lista
  recibe el aviso al reconectarse; la planilla, en cambio, muestra su nombre provisto de inmediato porque
  lee la lista vigente al exportar.
- **La planilla guarda sesiones, no un estado de presencia.** Un estudiante con el documento ilegible se
  omite de la planilla (con warning) hasta que se reconecta y se reescribe.
- **Una conexión de profe opera una sola sala.** Las demás pestañas de la sala reciben la lista de salas
  por el room `cuentaProfe`.
