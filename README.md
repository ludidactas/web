# Ludidactas

Revamp del sitio de Ludidactas con la visión de orientarlo a docentes.

Viene empezando como biblioteca de recursos, de los cuales la columna vertebral son los roadmaps. Este repo es la prueba de concepto (Proof of concept)

## Setup

- Instalarse la extensión 'MDX', para obtener syntax highlighting y todo eso en los archivos MDX

## Changelog

- Arrancamos con roadmaps svg exportados de affinity designer y levantado con `svgr` pasandole opciones a `svgo` para que no remueva los ids, de manera que podamos targetear los elementos svg con los nombres dados en affinity. Los ids tienen la forma `rm.[id]` para que puedan discernirse los elementos del resto de los ids por el prefijo.
- Luego agregamos soporte para markdown con front-matter con MDX. La configuración de estas cositas está en `next.config.ts`.
- Adoptamos `shadcn` como fuente de componentes.
- Instalamos `remeda` como alternativa a `lodash`.
- Agregamos zod para validación, sobre todo de los front-matter.
- Armamos un LibretaContext, estado para llevar registro de las unidades, mirroreada al localStorage, y un hook `useLibreta`, para usarla de manera ergonómica.
- Instalamos `usehooks`, en primera para el renderizado responsive con `useMediaQuery`, aunque cabe usar muchas otras de sus funciones.
- Agregamos `glob` para levantar los archivos md dinámicamente

## Checkear

https://www.svgator.com/
https://react-typescript-cheatsheet.netlify.app
https://react-hook-form.com
https://github.com/7PH/powerglitch
