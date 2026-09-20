# Ludidactas

Revamp del sitio de Ludidactas con la visión de orientarlo a docentes.

Viene empezando como biblioteca de recursos, de los cuales la columna vertebral son los roadmaps. Este repo es la prueba de concepto (Proof of concept)

## Arquitectura

Guía corta para no repetir un par de trampas conocidas.

### Dos procesos separados: Next y WSS

La app Next (`src/`) y el server de tiempo real (`wss/`) corren en **instancias distintas** (en dev son dos terminales; en prod, dos deploys). No comparten memoria, estado ni las conexiones socket.

- La lógica de WSS **no puede vivir en Server Actions** ni en el runtime de Next: las actions corren en la instancia de Next, mientras que los sockets y su estado viven en la instancia WSS. Una action no ve las conexiones (y además tendría que pasar por EEUU para terminar llegando a Rosario).
- Toda interacción de tiempo real pasa por `socket.io`. Nos apoyamos en sus idiomas y patrones todo lo que podamos. El server (`wss/`) y el cliente (`wss-cli/`) son espejos: por cada handler de server hay uno de cliente.

### Mensajería: comando→ack vs estado→evento

- **Comando** (pido algo y espero un resultado puntual) → usar **ack** de socket.io: `socket.emitWithAck` en cliente, helper `conAck` en server (`wss/middleware/error-handling.ts`), con envelope `Ack<T> = { ok, data } | { ok, error }`. Ej: `sala:crear` responde `{ idSala }`.
- **Estado compartido** que el server empuja y varios observan → **evento/broadcast**. Ej: `salas:lista` a la room `profe:${email}` (refresca todas las pestañas del profe).

En general, si el emit espera respuesta, es un ack.

### Reconciliar estado en vivo vs. al reconectar

Cuando un hecho puede enterarse un cliente de dos formas distintas —un evento en vivo empujado por el server mientras la pestaña está abierta, o una consulta de reconciliación al conectar/refrescar (ej. "¿tengo algo pendiente?")— las dos vías tienen que terminar en la **misma** pieza de estado, o la UI que depende de "cómo llegó el dato" en vez de "qué dice el dato" se rompe apenas alguien refresca en el momento equivocado.

### Stores globales (zustand) y navegación SPA

Los stores son singletons **por pestaña** que sobreviven a la navegación entre rutas. Si un store guarda estado ligado a "la entidad activa" (ej: la config de la sala abierta), hay que **limpiarlo en el teardown** de la conexión/página; si no, la siguiente ruta lee el valor de la anterior antes de que llegue el fresco.

### Autenticación (next-auth + IdP falso en dev)

El login lo maneja next-auth en `src/app/auth.ts`. La sesión es un JWT (stateless): no hay tabla de sesiones, el token _es_ la sesión. El WSS es un proceso aparte y no comparte esa sesión: valida su propio token (`wss/middleware/auth.ts`).

El provider cambia según el entorno, pero el flujo es el mismo:

- **Prod** → Google.
- **Dev** → un **IdP OIDC falso** local (`npm run idp:dev`, en `scripts/idp-dev.ts`). Existe porque Google rechaza IPs de LAN, lo que impide probar el login real desde el celular. El IdP falso corre el flujo OIDC **completo y real** (la misma ruta de next-auth que usa Google en prod), pero acepta LAN y no requiere registrar ninguna app.

Además, solo en dev, hay un provider de credenciales (`credencialesMock`) que fabrica una sesión sin pasar por OIDC; lo usa `loginFake` para los e2e que solo necesitan estar logueados.

**`IDP_HOST`**: lo leen dos procesos que deben coincidir — el IdP falso (`idp:dev`), que lo setea como issuer, y la app (`auth.ts`), que arma el `issuer` que espera del provider. Por defecto `localhost`. Para probar por LAN (celular), pisarlo inline con la IP de la máquina en **ambos** procesos: `IDP_HOST=192.168.x.x npm run idp:dev` y `IDP_HOST=192.168.x.x npm run expose`.

Cómo se verifica el login:

- `tests/idp-login.spec.ts` — e2e que atraviesa el flujo OIDC completo vía el botón real (levanta su propio IdP, es autocontenido).
- `npm run idp:check` (`scripts/check-idp-login.ts`) — chequeo manual standalone sin Playwright; requiere `npm run dev` + `npm run idp:dev` corriendo.

## Bugs

- Cuando un estudiante está en la sala y el docente publica una pregunta, al estudiante le aparece como 'ya votaste'
- Parece que no se invalida la sesión al cambiar de usuario... conectarse con una cuenta, luego con otra, sigue diciendo "ya votaste"

## Go — pendiente para después del baseline

Quedó afuera del baseline de salida a prod:

- **Lista de "partidas activas en la sala"** y poder **observar otra partida mientras jugás la propia**. Hoy `PartidaEnCurso` ocupa toda la pantalla sin salida a observar a otros, y la única forma de ver partidas ajenas es desde `BuscarRival` (cuando no tenés partida propia). Requiere un query nuevo (partidas activas de la sala, no solo por rival individual) y repensar el layout de `PartidaEnCurso` para dejar lugar a un modo espectador simultáneo.
- **Varias invitaciones entrantes simultáneas, incluso de la misma persona.** El server hoy modela "partida activa" como un puntero único por usuario (`db.getPartidaActiva`), así que solo puede haber una invitación pendiente a la vez. La UI ya quedó orientada a lista (`desafiosEntrantes` en `GoJuego`) para cuando el modelo de datos del server soporte más de una.

## Setup

- Correr un server redis. Puede ser standalone o con docker.
- Correr `bun/npm i`
- Correr el server con `bun/npm wss:dev`

- Agregar las variables locales necesarias:

  - NEXTAUTH_SECRET= $(`openssl rand -base64 32`)
  - POLLS_ADMINS= $un_mail

- Correr el proyecto next en otra terminal con `bun/npm dev`
- Los tests se corren con `bun/npm e2e` (de end-to-end)

## Checkear

https://www.svgator.com/
https://react-typescript-cheatsheet.netlify.app
https://react-hook-form.com
https://github.com/7PH/powerglitch

### Línea para gifear un grupo de imágenes png:

ffmpeg -framerate 4 -i logo%d.png -vf "format=rgba,split[s0][s1];[s0]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[s1][p]paletteuse" -loop 0 logo.gif

Reemplazar `logo` con lo que corresponda

## CLS - Cumulative Layout Shift

Para cualquier elemento que se resuelve de forma asíncrona (imagen, fuente, dato remoto), el espacio que reserva en el primer render tiene que coincidir con el espacio que va a ocupar una vez resuelto.

Para imágenes puntualmente, el checklist es:

- `width/height` (o fill + contenedor con tamaño fijo) tienen que reflejar la proporción real del archivo — son los que le dicen al navegador qué aspect-ratio reservar antes de que llegue un solo byte de la imagen.
- Si el CSS fuerza una sola dimensión (w-_ sin h-_), agregar h-auto (o viceversa) para que la otra se calcule proporcionalmente en vez de quedar en un valor por defecto inconsistente.

(hoy aprendí)
