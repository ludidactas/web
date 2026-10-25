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
| Cambia el nombre o la estructura de las **claves** de redis (hash nuevo, índice, split) | Fuera del alcance del codec: script one-off o runner de arranque. |

Una migración es una función pura, recibe el documento sin `v` y no conoce redis.

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
Antes de agregar un campo obligatorio, o de adoptar un documento nuevo, conviene correr el schema contra
los documentos existentes de un redis real: las partidas de Go anteriores a los modos no traían `modo`
y se resolvió con `.default('partida')` en el schema, sin migración.
