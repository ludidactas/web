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

## Setup

- Correr un server redis. Puede ser standalone o con docker.
- Correr `bun/npm i`
- Correr el server con `bun/npm wss:dev`

- Agregar las variables locales necesarias:

  - NEXTAUTH_SECRET= $(`openssl rand -base64 32`)
  - POLLS_ADMINS= $un_mail

- Correr el proyecto next en otra terminal con `bun/npm dev`
- Los tests se corren con `bun/npm e2e` (de end-to-end)

### Variables de entorno

Lista completa (más allá de las dos mínimas para levantar solo el wss, arriba). "Runtime" lee la variable en el proceso del server; "build-time" queda inlineado en el bundle del browser al buildear Next, así que un cambio requiere rebuild/redeploy, no solo reiniciar.

| Variable | Quién la lee | Cuándo | Para qué |
| --- | --- | --- | --- |
| `JWT_SECRET` | Next (`src/server/token_wss.ts`, firma) y wss (`wss/middleware/auth.ts`, verifica) | runtime | Secret compartido del JWT de corta vida que autentica al socket contra el wss. Tiene que ser **el mismo valor exacto** en ambos lados. |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Next, internamente (Auth.js) | runtime | Firma la cookie de sesión del navegador. `AUTH_SECRET` es el nombre nuevo de Auth.js v5; si no está seteado, cae a `NEXTAUTH_SECRET`. No lo usa el wss. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Next (`src/server/google/cliente.ts`, provider de login y cliente de Drive) | runtime | Credenciales de la app OAuth de Google. |
| `POLLS_ADMINS` | wss (`wss/middleware/auth.ts`) | runtime | Emails con rol admin en el wss, separados por coma. |
| `NEXT_PUBLIC_HOST` | wss (`wss/salas/app.ts`), pese al nombre | runtime | Host que se antepone al armar el `link` de una sala nueva (queda guardado en Redis al crearla, no se recalcula después). |
| `NEXT_PUBLIC_ENCUESTA_HOST` | Next, client-side (`wss-cli/utils-socket-wss.ts`) | **build-time** | Host del wss al que se conecta el cliente de socket.io desde el browser. |
| `IDP_HOST` | Next + `scripts/idp-dev.ts` | runtime | Ver sección **Autenticación** más arriba (login por LAN). |
| `APP_HOST` | `scripts/check-idp-login.ts` | runtime | Solo para el chequeo manual de login, no para correr la app. |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_USERNAME` / `REDIS_PASSWORD` | wss (`wss/redis.ts`) | runtime | Conexión a Redis. Host/puerto por default apuntan a `127.0.0.1:6379` (sin auth) si no están seteadas — para local alcanza con tener un Redis corriendo ahí, no hace falta setear nada. |
| `PORT` | wss (`wss/server.ts`) | runtime | Puerto del server de wss, default `3005`. |

### WSS con Docker (alternativa a los dos pasos de arriba)

En vez de correr Redis y el server de WSS a mano, `docker-compose.yml` levanta los dos juntos (usa las variables de `.env.local`, así que necesita `NEXTAUTH_SECRET`/`POLLS_ADMINS` ya seteadas ahí):

- Levantar todo: `docker compose up --build -d`
- Ver logs: `docker compose logs -f wss`
- Apagar todo (y borrar los datos de Redis de la prueba, es efímero a propósito): `docker compose down`
- Después de tocar código en `wss/`, hay que reconstruir la imagen: `docker compose up --build -d` de nuevo (no tiene hot-reload)

El server queda en `localhost:3005`, igual que `wss:dev` — el resto del setup (correr Next en otra terminal) es igual.

## Pendiente

- `JWT_SECRET` está bien separado de `NEXTAUTH_SECRET`/`AUTH_SECRET` en el código (cada uno con su propia variable, ver tabla de arriba), pero en local (`.env.local`) los dos todavía tienen cargado **el mismo valor de string**, porque nunca se regeneró `JWT_SECRET` de forma independiente — falta confirmar si eso también pasa en staging/producción. Hay que generar un `JWT_SECRET` propio y distinto (`openssl rand -base64 32`) por ambiente y actualizarlo a la vez en Vercel (Next, firma) y en la Application de Coolify correspondiente (wss, verifica) — son un par, tienen que cambiar juntos.

## Deploy y ambientes

**Next (`src/`)** se deploya en Vercel:

- Producción: rama `main`, en `ludidactas.com`.
- Staging: rama `staging`, con preview permanente en `staging.ludidactas.com`.

**WSS (`wss/`)** se deploya en un VPS que corre [Coolify](https://coolify.io) (PaaS self-hosted), con panel en `https://deploy.ludidactas.com`. Coolify gestiona ahí los containers Docker del wss, sus Redis, y el proxy reverso (Traefik) que expone todo con TLS automático (Let's Encrypt) — todo el tráfico entra por Traefik, que rutea por dominio a cada servicio y renueva los certificados solo.

El wss corre como dos Applications de Coolify independientes, ambas construidas desde el mismo `wss/Dockerfile`, cada una con su propio Redis (también gestionado por Coolify) y sus propias variables de entorno — nada se comparte entre ambientes, así una prueba de estrés deliberada en staging no puede afectar producción:

| Environment | Branch    | Dominio                      | Redis              |
| ----------- | --------- | ---------------------------- | ------------------ |
| Producción  | `main`    | `ws.ludidactas.com`          | `redis-production` |
| Staging     | `staging` | `wss.staging.ludidactas.com` | `redis-staging`    |

Cada Application tiene seteadas sus propias `PORT`, `REDIS_HOST`/`REDIS_PORT`/`REDIS_USERNAME`/`REDIS_PASSWORD`, y los secrets de auth (mismos nombres que en local, ver sección **Setup**) — con valores independientes por ambiente.

Ambas Applications tienen auto-deploy activado (`Deploy on push` vía webhook): un push a `main` o a `staging` redeploya sola la Application correspondiente, sin acción manual en Coolify.

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
