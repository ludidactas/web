# Go — mapa de la órbita

El feature de Go está repartido en varias carpetas del repo, no solo acá. Este README describe el
conjunto completo — dónde vive cada responsabilidad y dónde termina cada boundary — para no tener que
adivinar "qué es qué" entre tantos archivos parecidos.

## Las cuatro capas

1. **Reglas puras** (`src/lib/go/`, esta carpeta): capturas, ko, territorio, puntaje, vida
   incondicional (Benson), y el dibujo del tablero. Sin red, sin Redis, sin conocer "desafíos" ni
   "partidas" — solo tableros y jugadas. La usan directo el server, la partida en vivo y el dojo.
2. **Dojo de ejercicios** (`src/lib/go-dojo/`): un `Desafio` (YAML) + su evaluación + su UI,
   standalone, sin red. Construye su propio tablero de una sola posición y llama a la capa 1.
3. **Partida en vivo — servidor** (`wss/go/`, `wss/validators/go.ts`): estado de una partida real
   (turnos, invitaciones, conteo), persistida en Redis, transmitida por socket.io. Server-authoritative:
   el cliente nunca decide el resultado, solo lo previsualiza con la misma capa 1.
4. **Partida en vivo — cliente** (`wss-cli/*-go-*`, `src/components/salas/go/`): espejo del estado del
   servidor + la UI que lo conecta con el tablero de la capa 1.

Regla de dependencia: 1 no depende de 2/3/4. 2 depende de 1 pero no de 3/4. 3 depende de 1 pero no de
2/4. 4 depende de 1 y 3 pero no de 2. Ningún archivo de "reglas puras" debería importar `wss`, `redis`,
`socket.io` ni `yaml`.

## Árbol de archivos

```
src/lib/go/                          # capa 1: reglas puras + dibujo del tablero
  motor.ts                           # capturas/ko/territorio/puntaje — el único lugar con estas reglas
  motor.test.ts
  benson.ts                          # vida incondicional (algoritmo de Benson, 1976)
  benson.test.ts
  tablero-go-base.tsx                # el <svg> del tablero (grilla/hoshi/piedras/click), compartido
  tablero-go-base.test.tsx

src/lib/go-dojo/                     # capa 2: dojo de ejercicios (standalone, sin red)
  tipos.ts                           # schema (zod) de un Desafio — el contrato del YAML
  motor-desafio.ts                   # evalúa una jugada de un Desafio, delega en motor.ts
  motor-desafio.test.ts
  index.ts                           # barrel público (isomórfico: sin node:fs)
  desafios/
    cargador.ts                      # parseo/validación YAML → Desafio[] (puro, sin node:fs)
    cargador-fs.ts                   # + lectura de disco (Node-only)
    index.ts                        # colecciones con nombre (getDesafiosEjemplo, ...), una por .yaml
    contenido/
      desafios-de-ejemplo.yaml       # contenido de la colección "ejemplo"
    desafios.test.ts
  components/
    desafio-dojo-go.tsx              # tablero de un desafío (envuelve tablero-go-base.tsx)
    desafio-dojo-go.test.tsx
    use-desafio-go.ts                # hook: estado de jugar/reiniciar/ayuda/explicación de un Desafio
    tarjeta-desafio-go.tsx           # tarjeta de un desafío (hook + tablero + texto + botones)
    conjunto-desafios.tsx            # índice + desafío actual + navegación anterior/siguiente

src/app/(sitio)/go/dojo/             # ruta pública que muestra el dojo
  page.tsx                           # server component: carga getDesafiosEjemplo()
  contenido.tsx                      # client component: título + ConjuntoDesafios

wss/go/                              # capa 3: servidor de la partida en vivo
  app.ts                             # comandos (invitar/jugar/pasar/...) — orquesta 1 + db.ts + lock.ts
  handlers.ts                        # registra los comandos de socket.io bajo una identidad
  db.ts                              # persistencia en Redis
  lock.ts                            # mutex por partida (evita carreras get→mutar→set)
wss/validators/go.ts                 # zod schemas/tipos de Partida — el contrato server↔cliente

wss-cli/                             # capa 4: espejo cliente del servidor
  handlers/estudiante-go-handlers.ts # emite comandos, actualiza el store, identidad = estudiante
  handlers/profe-go-handlers.ts      # ídem, identidad = profe (calco del anterior)
  stores/go-store.ts                 # estado (zustand): partida, invitaciones, contrincantes, espectador

src/components/salas/go/             # capa 4: UI de la partida en vivo
  go-juego.tsx                       # todo el flujo (buscar contrincante, invitar, jugar, observar)
  partida-go.tsx                     # tablero de la partida (envuelve tablero-go-base.tsx)
  partida-go.test.tsx
  go-estudiante/go-estudiante.tsx    # shell del estudiante (usa useConexionEstudiante)
  go-estudiante/index.tsx            # página del estudiante (banner + resuelve userId)
  go-profe/go-profe.tsx              # shell del profe (usa useConexionProfe)
  go-profe/index.tsx                 # página del profe (tabs, lista de estudiantes, visualizador)

src/app/(herramientas)/…/go/page.tsx # las dos rutas que montan la partida en vivo, ver abajo

tests/go-*.spec.ts                   # e2e (Playwright): benson, espectador, profe-contrincante, reinvitación
```

## Cosas que confunden fácil

- **Dos rutas casi idénticas para la partida en vivo, no es un typo**:
  `src/app/(herramientas)/sala/[idSala]/(nav)/go/page.tsx` (estudiante, singular + `(nav)`) vs
  `src/app/(herramientas)/salas/[idSala]/go/page.tsx` (profe, plural). Cada una monta un componente
  distinto (`go-estudiante` / `go-profe`), que a su vez comparten `GoJuego`.
- **`src/components/custom/ld-go.tsx` NO es parte de este feature.** Es una ilustración decorativa (los
  gatos jugando al Go, con efecto de explosión de piedras al pasar el mouse) que comparte nombre por
  tema, no por código — no importa nada de `lib/go`/`wss/go`. Se usa como banner en
  `go-estudiante/index.tsx` y `go-profe/index.tsx`.
- **Una sola convención de coordenadas, de punta a punta.** Todo habla en `(fila, columna)` — `motor.ts`,
  el dojo, `PartidaGo`, y el protocolo de red de la partida en vivo (`jugadaSchema`, `Partida.ultimaJugada`
  en `wss/validators/go.ts`). Coincide con el propio indexado de `Tablero` (`tablero[fila][columna]`), así
  que no hay ninguna conversión de eje escondida en ningún lado.
- **`Color` es un solo tipo compartido** (`'N' | 'B'`, en `motor.ts`) — tanto la partida en vivo como el
  dojo lo usan igual; no hay una representación numérica en paralelo.
- **El dojo no reimplementa reglas.** No tiene su propio "motor" — arma un tablero de una sola posición
  con `tableroVacio`/`capturasEnJugada` de `motor.ts` y nada más; no conoce ko ni historial de jugadas
  (no le hacen falta: cada desafío es una posición fija).

## Testing

- Unitarios: `bun test src wss` — cubre `motor.ts`, `benson.ts`, `motor-desafio.ts`, el parseo/
  contenido de `desafios/`, y los componentes React más importantes (`tablero-go-base.test.tsx`,
  `partida-go.test.tsx`, `desafio-dojo-go.test.tsx`) con `@testing-library/react` + happy-dom (ver
  `bunfig.toml`/`happydom.ts` en la raíz).
- E2E (Playwright): `tests/go-*.spec.ts` — incluye una partida completa con Benson + conteo real
  (`go-benson.spec.ts`), el flujo de espectador, el profe como contrincante, y reinvitación tras una
  partida terminada.
