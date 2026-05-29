# Ludidactas

Revamp del sitio de Ludidactas con la visión de orientarlo a docentes.

Viene empezando como biblioteca de recursos, de los cuales la columna vertebral son los roadmaps. Este repo es la prueba de concepto (Proof of concept)

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
