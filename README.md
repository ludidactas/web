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

## Checkear

https://www.svgator.com/
https://react-typescript-cheatsheet.netlify.app
https://react-hook-form.com
https://github.com/7PH/powerglitch

### Línea para gifear un grupo de imágenes png:

ffmpeg -framerate 4 -i logo%d.png -vf "format=rgba,split[s0][s1];[s0]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[s1][p]paletteuse" -loop 0 logo.gif

Reemplazar `logo` con lo que corresponda
