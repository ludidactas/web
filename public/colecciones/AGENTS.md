# Colecciones de preguntas — guía de autoría

Esta carpeta contiene **presets de colecciones** que vienen de ejemplo en la app. Cada
colección es un `.yaml` (formato validado por `wss/validators/colecciones.ts`) y se
registra en `manifest.json`.

## Norte editorial

El objetivo de fondo es **transmitir dignidad, fraternidad y discernimiento**, y hacerlo
**despertando sentido crítico**, no pidiendo adhesión. Las colecciones no son cuestionarios
con respuesta correcta: son **encuestas en vivo** para debatir en el aula.

**Equilibrio y distribución.** No hace falta que todo sea abierto. Conservar alrededor
de **una de cada tres** preguntas como dato cerrado: funcionan como **anclas de asombro**
(p. ej. la universidad más antigua, el Canon usado casi 600 años). Pero **intercalar**
abiertas y cerradas a lo largo de la colección —nunca un bloque de abiertas al inicio y
otro de quiz después—. El arco de la regla 8 sigue valiendo: las reflexivas y
propositivas van al cierre.

## El recetario (qué hace buena a una pregunta)

1. **Conocimiento por sobre opinión.** Preferir preguntas que revelen un _hecho_ que
   sorprende, antes que preguntas que invitan a coincidir con una postura obvia.
   - ✅ "¿Qué fue decisivo para la Revolución Industrial inglesa?" (y el algodón esclavo aparece como opción)
   - ❌ "¿Qué pasó realmente en 1492?" (demasiado dirigida, invita a la coincidencia)
2. **Desmontar el mito meritocrático.** Buscar los hitos que se cuentan como puro
   ingenio/esfuerzo (Revolución Industrial, ascenso europeo, "progreso") y poner de relieve
   su base oscura y silenciada (trabajo esclavo, saqueo, despojo).
3. **Sorprender con datos reales y verificables.** Escala de la trata transatlántica,
   tamaño de Potosí, la indemnización que pagó Haití, la universidad más antigua del mundo,
   el origen indio de los "números arábigos", alimentos americanos. El asombro abre el debate.
4. **Anclar en la obra de referencia.** Para _Historia decolonial_: Enrique Dussel —
   el encubrimiento del Otro (1492), el mito de la modernidad, la víctima/exterioridad,
   la transmodernidad. Cruzar siempre con la **mirada argentina/latinoamericana**.
5. **No moralizar, no cerrar.** Evitar opciones que sermonean. Que varias opciones sean
   defendibles y verdaderas: así hay debate genuino, no una respuesta evidente.
6. **Rotar la posición de la opción incómoda.** La respuesta crítica/reveladora NO debe
   caer siempre al final. Distribuirla entre las posiciones 1–4 a lo largo de la colección
   para que no haya patrón delator. (El FE **no baraja** las opciones: se muestran en el
   orden del `.yaml`.)
7. **Paridad de redacción entre opciones.** La opción correcta/reveladora no puede ser la
   única "con acotación": si una lleva explicación o un dato extra ("…, porque…", "…que
   luego asumió el Estado") y las demás son escuetas, se delata sola, sin importar la posición.
   Darle a las cuatro un largo y un nivel de detalle parejos — **preferentemente todas con
   acotación** (o, si no, todas escuetas). Vale también para "¿quién/qué/cuándo?":
   acompañar cada distractor con una justificación plausible ("La banca británica, mediante
   nuevos préstamos" / "El imperio español, con la intención de recuperar sus colonias").
8. **Arco de la colección.** Abrir y sostener con preguntas de conocimiento crítico;
   cerrar (últimas 3–4) con preguntas reflexivas y propositivas: "¿para qué sirve hoy?",
   "¿cómo lo rebautizarías?", "¿qué te gustaría hacer distinto?". Del desmontaje a la
   dignidad y la reparación, nunca quedándose solo en la bronca.
9. **Dignificar al sujeto, no humillar.** El mito se ofrece como una opción más para
   discutirla, no para ridiculizar a quien la elige.

## Pregunta abierta por sobre quiz (criterio rector)

El formato por defecto es la **pregunta abierta de múltiples perspectivas**, no el
quiz con respuesta correcta. El norte es **suscitar debate y asombro**, no evaluar
retención. Pedagogía **acogedora**: que nadie sienta que "falló" por elegir mal; el
voto es el punto de partida del intercambio, no una nota.

- **El dato asombroso va dado, no se examina.** Si hay un hecho que sorprende (una
  etimología, una fecha, un "primero de la historia"), ofrecerlo ya enunciado y
  preguntar _qué sugiere_, _qué sorprende_ o _cómo se lee_, en vez de pedir que lo
  adivinen.
- **Opciones todas verdaderas o defendibles.** Como en la primera pregunta de cada
  colección: varias lecturas válidas conviven y se vota cuál resuena, no cuál es "la
  correcta". Conecta con la regla 5 (no cerrar, que haya debate genuino).
- **Nada de distractores-trampa.** No diseñar opciones falsas verosímiles para inducir
  el error ("tricking into"). Cuidado: resolver la paridad de la regla 7 inventando
  señuelos plausibles contradice este norte. La opción mítica o incómoda puede aparecer
  para discutirla (regla 9), nunca como cepo.

## Formato técnico

```yaml
version: 1
nombre: Nombre visible de la colección
preguntas:
  - pregunta: 'Texto de la pregunta' # comillas si tiene : u otros caracteres especiales de YAML
    opciones:
      - Primera opción
      - Segunda opción
    admiteAportes: true # ¿pueden lxs estudiantes sumar su propia respuesta?
    admiteMultiplesVotos: true # ¿se puede elegir más de una opción?
    maxMultiplesVotos: 2 # tope de selecciones, o null si no hay tope
```

Reglas del validador (`crearEncuesta`):

- Cada pregunta necesita **≥ 2 opciones** _o bien_ `admiteAportes: true`.
- Ninguna opción puede estar vacía.
- `maxMultiplesVotos`: número o `null`.

Convenciones que venimos usando:

- Usar `admiteAportes: true` cuando tenga sentido que el grupo agregue su propia voz
  (preguntas conceptuales y reflexivas). Para preguntas de dato duro con respuesta
  cerrada (cifras, fechas, "¿qué ciudad…?"), suele ir `admiteAportes: false`.
- Para "elegí todas las que correspondan", `admiteMultiplesVotos: true` con `maxMultiplesVotos`
  igual a la cantidad de opciones verdaderas.

## Al crear o editar una colección

1. Escribir el `.yaml` en esta carpeta.
2. Registrarla en `manifest.json` (`nombre`, `descripcion`, `archivo`).
3. Validar que parsea y cumple el schema antes de dar por terminado.
