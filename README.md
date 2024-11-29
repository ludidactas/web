# Ludidactas

Revamp del sitio de Ludidactas con la visión de orientarlo a docentes. 

Viene empezando como biblioteca de recursos, de los cuales la columna vertebral son los roadmaps. 

## Changelog

- Arrancamos con roadmaps svg exportados de affinity designer y levantado con svgr pasandole opciones a svgo para que no remueva los ids, de manera que podamos targetear los elementos svg con los nombres dados en affinity. Los ids tienen la forma `rm.[id]` para que puedan discernirse los elementos del resto de los ids por el prefijo