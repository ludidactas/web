import * as client from '@prometheus-io/client'

client.collectDefaultMetrics()

/** Sockets conectados en este momento (incluye todos los roles: profe, estudiante, dojo). */
export const conexionesActivas = new client.Gauge({
  name: 'wss_conexiones_activas',
  help: 'Sockets conectados actualmente',
})

/** Cuenta cada evento que entra por un socket, incluidos los que no tienen contrato registrado. */
export const eventosRecibidos = new client.Counter({
  name: 'wss_eventos_total',
  help: 'Eventos de socket recibidos, por nombre',
  labelNames: ['evento'],
})

/** Duración de un comando con ack, desde que entra hasta que se llama al callback. */
export const ackDuracion = new client.Histogram({
  name: 'wss_ack_duracion_segundos',
  help: 'Duración de comandos con ack',
  labelNames: ['evento'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
})

export const registro = client.register
