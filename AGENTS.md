# AGENTS.md

Criterio de trabajo y de review destilado de sesiones reales en este repo. No es un manual genérico:
cada punto salió de algo concreto que pasó acá. Se actualiza a medida que aparecen nuevos patrones —
no es un documento que se escribe una vez y se congela.

## Comentarios y documentación

- **Describir el qué actual, nunca la historia del cambio.** Nada de "en vez de", "antes hacía",
  "ahora usamos", "ya no". Tampoco negaciones tipo "esto no es X" o "no hay línea nítida entre A y B"
  que solo tienen sentido contrastando con una alternativa descartada — si hace falta explicar una
  decisión de diseño, se explica el requisito que cumple hoy, no contra qué se comparó.
  - Excepción real: una negación vale cuando es una trampa concreta para quien llama (ej. "esta
    función cancela el timer local, no toca redis" cuando existe una contraparte con nombre parecido
    que sí lo hace). Tiene que ser puntual, exacta y necesaria — no una salida fácil para no pensar la
    frase en positivo.
  - Esto aplica también a READMEs de feature, no solo a comentarios de código. Una sección "por qué
    elegimos X" describe el requisito y cómo X lo resuelve, no la implementación anterior que se dejó
    atrás.
- **Un README por feature no calca el formato de otro.** El de un feature con capas paralelas e
  independientes (reglas de un juego, por ejemplo) no le queda bien a un pipeline lineal con estado
  (una máquina de estados tipo apertura/cierre de clase). Antes de escribir, preguntarse qué forma
  cuenta mejor ESTE feature: capas con regla de dependencia, pipeline paso a paso, o una narrativa de
  "cómo lo vive el usuario" seguida de "cómo está construido". El árbol de archivos y una sección de
  gotchas ("cosas que confunden fácil") sirven casi siempre; el resto se adapta.
- **Documentar los límites conocidos y aceptados a propósito**, con la razón por la que no se
  cierran (ventana de tiempo insignificante, costo de arreglarlo no justifica el riesgo real). Si no
  se escribe, un review futuro lo va a "encontrar" y alguien va a gastar tiempo evaluando algo que ya
  se evaluó.

## Antes de integrar una librería externa

- **Correr un script de prueba contra casos conocidos antes de confiar en tipos o documentación.**
  No alcanza con que compile. Ejemplos reales de esta sesión: bullmq no arma su propia conexión a
  partir de `{host, port}` en este runtime (ESM/bun) — hace falta pasarle una instancia de `ioredis`
  ya construida, algo que ningún tipo de TypeScript iba a avisar. `job.remove()` tira si el job ya
  está activo. Agregar un job con un `jobId` que ya existe no falla ni lo reemplaza, silenciosamente
  no-opea. Ninguna de estas tres cosas se sabía de antemano — se encontraron ejecutando scripts
  chicos contra redis real.
- **Verificar la interacción entre herramientas, no solo cada una por separado.** Mezclar
  `setSystemTime` (bun:test) con bullmq real rompe todo: bullmq calcula el vencimiento de un job
  demorado con `Date.now()` en el momento de agendarlo, así que con el reloj mockeado un delay de 20'
  resuelve a un timestamp del pasado, y CUALQUIER Worker vivo conectado a ese redis —el del propio
  proceso de test, o un proceso de desarrollo corriendo en paralelo sin relación con el test— lo toma
  casi al instante. Esto causó una evaluación duplicada real en un test que llevaba rato pasando: la
  causa no estaba en el código de producción, estaba en cómo el test montaba su escenario.
- **Antes de "arreglar" un bug sospechoso, reproducirlo con un script mínimo.** Confirmar la hipótesis
  con evidencia (un log, un assert que falla de la manera esperada) antes de tocar el código de
  producción. Un output crudo de un tool de review automatizado (o una sospecha propia) es un punto de
  partida, no un hecho — se verifica contra el código real, línea por línea, antes de reportarlo o
  arreglarlo.

## Simplicidad — en las dos direcciones

- **Reemplazar un mecanismo armado a mano por una herramienta hecha para el problema, cuando el
  problema ya está resuelto en la industria.** Timers locales + reconciliación manual al bootear +
  un sorted set propio para sobrevivir un restart era más código y más superficie de bugs que una cola
  de jobs con delay sobre redis (bullmq) — que ya trae eso resuelto y testeado.
- **Pero no agregar una capa nueva solo porque "se siente más robusto".** Se descartó reemplazar los
  timers por polling periódico: agregaba una capa (el poll loop) sin necesidad real dado el volumen
  (decenas de salas, no miles). La pregunta de corte: ¿el problema real justifica la complejidad de la
  solución, o es sobre-ingeniería para un caso que no va a pasar a esta escala?
- **Al sacar una restricción arbitraria, pensar qué reemplazo hace falta.** Sacar una lista fija de
  valores permitidos (`[15,30,45,60,90,120]`) para permitir un valor libre no significa "sin ningún
  límite" — significa "hay que decidir cuál es el límite real" (acá: positivo, con un techo sensato).
  Sacar la restricción sin pensar el reemplazo es lo que dejó un hueco real: un valor absurdo pasaba
  sin aviso y dejaba la condición imposible de cumplir para todo el mundo, silenciosamente.

## Invariantes y validación

- **Desconfiar de comparaciones con `>=`/`<=` contra un umbral configurable en 0.** Si un umbral puede
  llegar a ser 0, revisar si la comparación se vuelve una tautología (`x >= 0` es siempre verdad,
  cualquiera sea `x`). Cuando "sin condición" es un caso de negocio real y distinto (acá: "presente con
  solo conectarse un instante"), modelarlo como un caso propio y explícito, no como un valor límite de
  un campo numérico — es más fácil de razonar y evita este tipo de bug.
- **Encerrar el mismo invariante en todas las capas que puedan violarlo**, no solo en una. Un límite
  que solo vive en el schema del server no protege contra un valor que nunca llegó a mandarse porque
  el input del FE ya lo rechazó visualmente — pero un límite que solo vive en el FE no protege contra
  quien pega directo al server. Van los dos, y valen tests de cada capa por separado.

## Verificación de cambios de UI

- **Los cambios de FE se verifican en un navegador real, no solo leyendo el JSX.** Un bug de "input
  numérico controlado por React muestra dígitos viejos" (`0137` al tipear `137`) solo apareció al
  mirar una captura de pantalla real — la lectura del código no lo iba a mostrar. Usar Playwright
  (`chromium`, headless) contra una ruta de preview temporal cuando el componente necesita props que
  no son triviales de alcanzar por el flujo normal de la app (auth, sala real, etc.) — se crea, se
  usa, se borra en la misma sesión, nunca se commitea.
- **Repetir la verificación después de cada fix relevante**, no confiar en que "debería funcionar
  ahora" — el fix del input numérico en sí introdujo un caso nuevo a verificar (campo vacío, borde
  rojo, mensaje de error) que también se chequeó con captura real antes de dar por cerrado.

## Al revisar un PR/diff

- **Mirar desde varios ángulos por separado** (correctness, reuse/simplificación, eficiencia/altitud,
  convenciones del repo) en vez de un solo pase genérico — cada ángulo encuentra cosas que los otros
  no, y combinarlos en una sola pasada diluye la atención en cualquiera de ellos.
- **Verificar cada finding contra el código real antes de reportarlo o arreglarlo.** Un review
  (automatizado o no) puede alucinar líneas, malinterpretar el orden de ejecución, o describir una raza
  que en la práctica no es alcanzable. Cada hallazgo se lee en el archivo real, y cuando hace falta se
  confirma con un script (ver "antes de integrar una librería externa").
- **Separar lo que se arregla de lo que se documenta como aceptado.** No todo hallazgo real amerita un
  fix — una ventana de milisegundos que requiere una coincidencia de timing extrema no vale la
  complejidad de una transacción redis. Pero si no se arregla, se anota en el README como límite
  conocido, con la razón — no se descarta en silencio.

## Limpieza

- Scripts de verificación descartables van al scratchpad de la sesión, o se crean y se borran en el
  mismo turno si tienen que vivir dentro del repo (rutas de preview, tests de debug) — nunca quedan en
  el working tree al terminar.
- Antes de reportar una tarea como terminada: `git status` limpio de esos residuos, suite de tests
  corrida más de una vez si algo tocó concurrencia/estado compartido (una sola corrida en verde no
  descarta un flake real — ver el bug de evaluación duplicada, que solo aparecía en algunos runs hasta
  que se aisló la causa).
