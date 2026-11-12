# Infraestructura

## La VM

VPS en DonWeb, Ubuntu 22.04.5 (kernel `5.15.0-198-generic`):

| Recurso | Cantidad                         |
| ------- | -------------------------------- |
| CPU     | 2 vCPU (Intel Broadwell)         |
| RAM     | 3.8 GiB                          |
| Disco   | 84 GB (24% usado, ~65 GB libres) |

Todo corre en este único host: Docker, Coolify (el PaaS en sí — su app, su Postgres, su Redis, su
agente de métricas Sentinel), Traefik (proxy reverso de Coolify) y las dos Applications del wss
(`main`/producción y `staging`), cada una con su propio Redis. No hay separación de máquinas entre
el control plane (Coolify), el proxy y las cargas que sirven tráfico real — un problema a nivel host
(como el reboot que tiró todo el 2026-10-24) afecta a todo a la vez, porque todo vive en la misma VM.

Uso de recursos en un snapshot normal (sin picos de deploy ni de tráfico):

| Container                 | RAM      |
| ------------------------- | -------- |
| `coolify` (app)           | ~535 MiB |
| `coolify-db` (postgres)   | ~50 MiB  |
| `coolify-redis`           | ~11 MiB  |
| `coolify-sentinel`        | ~20 MiB  |
| `coolify-proxy` (traefik) | ~27 MiB  |
| wss producción            | ~84 MiB  |
| wss staging               | ~68 MiB  |
| redis producción          | ~5 MiB   |
| redis staging             | ~12 MiB  |

Total ocupado: ~800 MiB de 3.8 GiB. Hay margen hoy; lo único que vale tener presente es que los **2
vCPU se comparten entre build y runtime** — cuando Coolify buildea una imagen nueva (en cada push a
`main`/`staging`), ese build compite por CPU con el wss de producción sirviendo tráfico real, en la
misma VM. Con picos de uso esto puede notarse como latencia momentánea durante un deploy.

## Qué hay en pie

- **Rate limiting**: Traefik, el proxy de Coolify, frena el volumen de requests por IP antes de que lleguen a cada wss.
- **Observabilidad**: métricas de host y de ambos wss, más logs, van a Grafana Cloud.
- **Alertas**: errores graves avisan por Telegram desde el wss mismo; si un proceso (o el host entero)
  deja de responder, una alerta en Grafana lo detecta igual, desde afuera.

### Rate limiting (Traefik)

Limita conexiones/requests por IP de origen antes de que lleguen al proceso del wss — primera capa de
defensa contra flood, sin tocar código. Se configura como labels de Traefik en cada Application de
Coolify (Advanced → Labels), no vive en el repo:

```
traefik.http.middlewares.wss-ratelimit.ratelimit.average=50
traefik.http.middlewares.wss-ratelimit.ratelimit.burst=100
traefik.http.routers.https-0-<uuid>.middlewares=gzip,wss-ratelimit
```

`average` son requests/segundo sostenidos por IP, `burst` cuánto puede picar por encima antes de que
Traefik empiece a devolver `429`. Mismo valor en staging y producción; ajustable si en el uso real
resulta muy laxo o muy estricto.

**Ojo al editar labels a mano en Coolify**: activar el modo manual puede re-templar otros labels con
los defaults actuales de Coolify, no solo preservar lo que había — nos pasó con el middleware de gzip
de producción, que cambió de nombre y forma solo al entrar a ese modo, sin que lo tocáramos. Conviene
diffear el set completo contra lo que estaba corriendo antes de guardar, no solo revisar la línea que
se fue a cambiar. Los labels nuevos tampoco toman efecto hasta el próximo redeploy del container.

Es independiente de cualquier rate limit más fino que se agregue
después adentro del wss, a nivel de evento de socket (ver Backlog).

### Observabilidad (Grafana Cloud + Alloy)

Métricas y logs van a Grafana Cloud. **Grafana Alloy** es el agente que los recolecta y empuja —
corre como **servicio nativo de systemd en el host** (`alloy.service`), no es un container ni una
Application de Coolify, así que queda fuera de foco si se piensa la infra solo en containers:

| Archivo                                        | Qué tiene                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/etc/alloy/config.alloy`                      | Qué se scrapea y a dónde se manda — no está en git, se edita a mano por SSH.                     |
| `/etc/systemd/system/alloy.service.d/env.conf` | Secrets como `Environment=` de systemd, referenciados desde `config.alloy` vía `sys.env("...")`. |

**⚠️ Las variables de `env.conf` son del host (la VM), no del container.** No están en Coolify ni se
ven en `docker inspect` de ningún wss — viven en el sistema operativo de la VPS, porque Alloy mismo
corre ahí, no en Docker.

| Variable                                             | Para qué                                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `GCLOUD_RW_API_KEY`                                  | Autenticación de Alloy contra Grafana Cloud.                                                                      |
| `METRICS_TOKEN_STAGING` / `METRICS_TOKEN_PRODUCTION` | Copias del mismo token que cada Application tiene seteado en Coolify — hay que sincronizarlas a mano si se rotan. |

Qué manda: métricas de host (CPU/RAM/disco, `prometheus.exporter.unix`) y las de cada wss
(`wss_conexiones_activas`, `wss_eventos_total`, `wss_ack_duracion_segundos`, expuestas en
`GET /metrics`, ver `wss/metrics.ts`), cada uno scrapeado por separado con un label `environment` para
distinguirlos en las queries. `/metrics` pide `Authorization: Bearer <METRICS_TOKEN>` porque el mismo
endpoint es alcanzable desde internet vía Traefik (`PathPrefix('/')` matchea todo en `ws.ludidactas.com`)
— sin el token cualquiera lo podría ver.

`enabled` + `Restart=always`: Alloy sobrevive a reboots del host y se reinicia solo si crashea. Ni
Grafana ni Alloy son una feature nativa de Coolify — Alloy corre al margen por completo (host nativo,
no container); si en el futuro se agrega Grafana self-hosted, ese sí seguiría el patrón normal de una
Application detrás de Traefik.

Producción todavía no tiene nada de esto con datos reales: el código que expone `/metrics` vive en
`staging`, falta mergear a `main` y redeployar (el bloque de Alloy para producción ya está armado,
solo falta que tenga qué scrapear).

### Alertas (Telegram + Grafana)

Dos mecanismos, cada uno cubre lo que el otro no puede:

- **Desde el wss mismo** (`avisarTelegram` en `wss/alertas.ts`, cableado en `wss/redis.ts`,
  `wss/middleware/error-handling.ts`, y como última línea en `wss/mount.ts` antes de
  `uncaughtException`/`unhandledRejection`): da detalle rico del error en el momento en que pasa, pero
  solo funciona mientras el proceso sigue vivo para mandarlo. Dedupeado por clave con ventana de 1
  minuto para no floodear el chat si el mismo error se repite en ráfaga.
- **Desde Grafana**: una alert rule que no mira el error en sí sino la _ausencia_ de señal — el caso
  que el aviso interno no puede cubrir, porque si el proceso muere o el host se cae no hay quien
  dispare nada desde adentro. Query:
  ```
  absent_over_time(wss_conexiones_activas{environment="staging"}[2m])
  ```
  Con condición `WHEN QUERY is above 0`, "No Data" → `Normal`, "Error" → `Alerting`. La trampa de esta
  query: devuelve vacío (→ `Normal`) si la métrica tuvo datos en los últimos 2 min, y recién devuelve un
  valor real (`1`, → dispara la condición) si estuvo completamente ausente — así 0 conexiones reales
  (nadie usando staging en ese momento) no se confunde con el proceso caído. La ventana original era de
  5 min; se bajó a 2 (probado: un redeploy normal tarda consistentemente menos de 1m30s, así que no hay
  riesgo de falso positivo por el tiempo propio de un deploy) para detectar una caída real más rápido.

  Las dos reglas (staging y producción) arrancaron con la versión ingenua — query cruda
  (`wss_conexiones_activas{environment="..."}`) más "No Data → Alerting" directo — y las dos
  produjeron falsos positivos: a staging la alertaba cada vez que nadie estaba conectado (cero
  conexiones interpretado como caída), a producción la alertaba cada 4hs sin parar porque esa serie
  todavía no existe (ver nota de arriba) y "sin datos" ahí es permanente, no intermitente. Staging ya
  está migrada a `absent_over_time` y corregida; **producción queda pausada** hasta redeployar con
  `/metrics` y migrarla al mismo patrón.

**Variables de entorno** (en Coolify, por Application — no son del host como las de Alloy):

| Variable             | Para qué                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | Token del bot. Sin esto, `avisarTelegram` no hace nada.                                                                                                                     |
| `TELEGRAM_CHAT_ID`   | Chat al que se manda el aviso.                                                                                                                                              |
| `ENTORNO`            | `"staging"` o `"production"`, para distinguir el origen en el mensaje — no se puede usar `NODE_ENV` porque el `Dockerfile` lo fija en `production` en las dos Applications. |

## Backlog

Ideas y trabajo pendiente, sin orden estricto más allá de lo que parece más barato primero.

**Rate limiting granular por evento.** El de Traefik frena volumen bruto, pero no distingue "una sala
creando preguntas normalmente" de "alguien automatizando `encuesta:votar`". Para eso hace falta
throttling a nivel de evento de socket, con estado en Redis (ya disponible). Librería sugerida:
`rate-limiter-flexible` (backed por `ioredis`), envolviendo `conAck` en
`wss/middleware/error-handling.ts` para que cualquier comando nuevo lo herede. Abierto: con qué eventos
arrancar — los de escritura pública sin auth fuerte (`sala:crear`, votar, jugar) son los candidatos
obvios.

**Postgres para usuarios y subscripciones.** Coolify tiene Postgres como recurso nativo, mismo patrón
que los Redis ya en uso — nada nuevo que diseñar en infra. Dos preguntas abiertas:

- Acceso: ¿el wss abre su propia conexión a Postgres, o se mantiene la separación actual (Next y wss
  sin estado compartido, ver `README.md`) y el wss lee el estado de subscripción vía Redis, actualizado
  por Next con el mismo patrón de codec versionado de `wss/versionado.ts`?
- ORM: Drizzle (TypeScript nativo, migraciones versionadas, liviano) o Prisma (más conocido, engine
  binario aparte, menos control sobre el SQL generado).

**Backups y extracción de datos para pruebas.** Hoy no hay backup de nada en el VPS. Una vez que exista
Postgres con datos reales, Coolify soporta backups programados a un bucket S3-compatible (Backblaze B2,
Cloudflare R2) con restore desde la misma UI. Para usar esos datos en pruebas falta además un script de
sanitización que anonimice el dump (emails, nombres) antes de que toque staging o una máquina local —
una vez que haya usuarios reales, restaurar un backup de prod tal cual en otro ambiente es un problema
de privacidad. Abierto: si además de Postgres conviene backupear algo de Redis, o si se mantiene como
dato descartable (como es hoy).

**Excalidraw** (pizarra colaborativa para docentes y estudiantes, una por sala de las nuestras). Dos
piezas: el frontend (SPA estática, costo ~nulo) y `excalidraw-room` (server de colaboración vía
socket.io, sin persistencia). "Una pizarra por sala" no pide nada especial de infra: se logra usando
el id de la sala existente como room id de `excalidraw-room`, y un solo proceso ya multiplexa en
memoria tantas rooms lógicas como haga falta — mismo patrón que el wss propio con sus `salas`, no hay
límite de "una instancia, una sala".

Mismo patrón de deploy que el wss — dos Applications nuevas en Coolify, cada una con su subdominio. El
tráfico es distinto al del wss propio (muchos mensajes chicos y frecuentes en vez de comandos
puntuales), pero con las rooms chicas esperadas (un docente y su clase) el volumen se mantiene bajo.

Arranca con una sola instancia, sin Redis — la cantidad de salas no lo pide. Lo que sí pediría más de
una instancia (y ahí sí Redis, para sincronizar entre ellas) es el volumen total de tráfico de dibujo
de todas las salas juntas si el uso crece mucho — hoy, con pocos usuarios, no hace falta dejar nada
preparado de antemano para eso.

## Apéndice: si hay que reconfigurar algo

**Swap** (2 GB en `/swapfile`, ya hecho en la VM actual — dejar acá por si se migra de VM o hay que
rehacerlo):

```
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10 && echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```
