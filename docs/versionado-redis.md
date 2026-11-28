# Evolución del shape de lo guardado en redis

Los documentos JSON de redis se leen y escriben con un codec de `wss/versionado.ts`. Cada documento
guarda `v` (su versión) y, al leerlo, se migra en memoria hasta la forma actual y se valida con zod:
el resto del código solo ve el schema vigente.

```ts
export const salaCodec = versionado({
  schema: salaData,
  migraciones: [
    /* v0→v1, v1→v2, … */
  ],
})
salaCodec.parsear(str) // aplica las migraciones que faltan y valida
salaCodec.serializar(sala) // escribe con `v` = cantidad de migraciones
```

La versión actual es `migraciones.length`. Un documento sin `v` es v0, así que una entidad se adopta
sin migrar su data existente.

## Qué hacer según el cambio

| Cambio                                                                                  | Qué hacer                                                         |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Campo nuevo con valor por defecto                                                       | `.default()` / `.optional()` en el schema. Sin migración.         |
| Campo renombrado, partido, con otro significado                                         | Agregar una función al final de `migraciones` y su test.          |
| Cambia el nombre o la estructura de las **claves** de redis (hash nuevo, índice, split) | Fuera del alcance del codec: agregar una `Migracion` a `wss/migraciones/index.ts`.  |

Una migración es una función pura, recibe el documento sin `v` y no conoce redis.

## Migraciones de claves

`wss/migraciones/index.ts` lista, en orden, las migraciones de claves de redis (`{ id, destructiva?, patrones?, planificar(planificador) }` o `{ id, destructiva?, patrones?, dryRun(redis), up(redis) }`).
El `CMD` del Dockerfile corre `wss/migrar.ts` antes de levantar el server, en cada arranque del
container, así que el deploy a staging y a main las aplica solo, contra el redis de cada entorno.

- Cada id aplicado queda en el hash `migraciones:aplicadas`; un lock (`migraciones:lock`, TTL 2 min)
  serializa a las instancias que arrancan a la vez.
- **Protocolo en dos fases (`planificar`):** una pre-corrida de solo lectura escanea y clasifica todo
  antes de escribir, separando los comandos válidos de las entradas inválidas (documentos que no
  cumplen su schema o claves con otro tipo de Redis). Al aplicar, las unidades válidas se ejecutan en
  `MULTI` y las entradas rechazadas se mueven a `migraciones:pendientes:<id>` (conservando su valor o
  `DUMP` + `PTTL` y el motivo, con el mismo TTL de 7 días que el backup) sin frenar el resto de la
  migración.
- Para migraciones imperativas con `dryRun` + `up`, `dryRun` es obligatorio y corre siempre sin
  escribir antes de crear el backup y ejecutar `up`.
- **Guarda de exclusividad (`destructiva: true` y `restaurar.ts`):** `wss/migrar.ts` exige
  exclusividad (`CLIENT LIST`) salvo cuando `ENTORNO` es `staging` o `development` (fail-closed: si
  falta `ENTORNO`, protege por defecto). Si hay otro cliente conectado a redis (p. ej. el WSS
  anterior todavía vivo), aborta sin tocar datos. `restaurar.ts` aplica esta misma guarda en todos
  los entornos.
- Antes de correr `up`, el runner guarda un backup binario (`DUMP` + `PTTL`) de las claves en
  `patrones` (por defecto todas salvo `migraciones:*` y `bull:*`) en `migraciones:backup:<id>:*` con
  TTL de 7 días.
- Si una migración lanza una excepción (p. ej. fallo de Redis, `MULTI` rechazado, falta de
  exclusividad o error no capturado), el runner restaura automáticamente los cambios de esa migración
  (y de las anteriores de la misma corrida, en orden inverso) y el proceso sale con código distinto de
  0 sin levantar el server.
- **Rollback manual:** si el deploy arrancó bien y hace falta volver atrás, detener el WSS (para que
  deje de escribir), correr `bun run wss/migraciones/restaurar.ts <id>` (restaura el backup y saca
  `<id>` de `migraciones:aplicadas`) y pushear el commit previo a la rama para que Vercel y Coolify
  reconstruyan el código anterior.
- Una migración con `id` ya aplicado no se edita; el cambio va en una nueva.
- Las claves se migran en el arranque del server nuevo, con el anterior todavía sirviendo hasta que
  el healthcheck pase: en un deploy con rolling update, `up` tiene que dejar los datos legibles para
  ambas versiones, o una migración destructiva se corre con el WSS anterior detenido y backup previo
  en prod.

## Cosas que confunden fácil

- **Leer no escribe.** El documento queda en la versión vieja en redis hasta su próxima escritura
  normal; el lector lo migra en cada lectura. Es deliberado: un write-back al leer compite con los
  escritores concurrentes. Costo: una migración corre repetidas veces sobre documentos que no se
  escriben seguido.
- **Una migración publicada no se edita ni se borra** mientras pueda haber documentos en esa versión.
  Se agrega una nueva a continuación.
- **Rollback de deploy:** un server con menos migraciones rechaza (con error claro) los documentos
  escritos en una versión más nueva. Tras un deploy que sube la versión, revertir exige migrar hacia
  atrás a mano.
- **Datos que llegan del FE:** pasan por el schema de entrada del contrato WSS (`docs/contrato-wss.md`),
  que es la frontera. Los stores de zustand con `persist` llevan su propio `version` + `migrate`.
- **Scripts y herramientas que leen redis directo** (`wss/scripts/`) ven el campo `v` y el shape
  guardado, no el migrado; para leer el shape actual usar el codec.

## Adopción

El codec se usa en los valores que son un documento JSON. Los strings sueltos, contadores, sets y hashes
de strings (`partidaActiva`, votos, lista de invitados, dojo) no tienen shape que versionar.

| Documento | Codec |
|---|---|
| Sala (hash `salas`) | `salaCodec`, `wss/salas/db.ts` |
| Estudiante de la planilla, evento y pendiente de asistencia, registro de clase | `wss/salas/db.ts` |
| Partida de Go y partida pendiente de Drive | `wss/go/db.ts` (`partidaSchema`, `partidaDrivePendienteSchema` en `wss/validators/go.ts`) |
| Encuesta | `wss/polls/db.ts` |

## Lecturas estrictas

Leer valida con el schema actual y lanza si el documento no lo cumple, en vez de devolver un `as T`.
Dos lecturas toleran el documento ilegible, con un warning, para que uno solo no tire abajo la lista: las
encuestas de una sala (`getEncuestas`) y la planilla de estudiantes (`getEstudiantes`). El estudiante
omitido no figura en la planilla ni en la evaluación de asistencia (queda ausente) hasta que se
reconecta y `guardarEstudiante` lo reescribe.

Antes de agregar un campo obligatorio, o de adoptar un documento nuevo, conviene correr el schema contra
los documentos existentes de un redis real: las partidas de Go anteriores a los modos no traían `modo`
y se resolvió con `.default('partida')` en el schema, sin migración.
