import { createServer } from 'http'
import { io } from './io'
import { registro } from './metrics'

// Traefik rutea a este mismo puerto cualquier path de `ws.ludidactas.com` (`PathPrefix('/')`), así que
// `/metrics` queda alcanzable desde internet igual que `/socket.io/` — sin token, cualquiera lo ve.
const METRICS_TOKEN = process.env.METRICS_TOKEN

/** Pone el `io` a escuchar en `port` y le registra los eventos base y el cierre ordenado. */
export const mount = (port: number) => {
  // `io.listen(port)` arma su propio http.Server con un 404 hardcodeado para todo lo que no sea
  // socket.io, sin dejar lugar a rutas propias. Armamos el http.Server a mano y le pegamos socket.io
  // encima con `attach`, así `/metrics` puede convivir con el server de sockets.
  const httpServer = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/metrics') {
      if (METRICS_TOKEN && req.headers.authorization !== `Bearer ${METRICS_TOKEN}`) {
        res.writeHead(401)
        res.end()
        return
      }
      registro
        .metrics()
        .then((data) => {
          res.setHeader('Content-Type', registro.contentType)
          res.end(data)
        })
        .catch((err) => {
          res.statusCode = 500
          res.end(String(err))
        })
      return
    }
    res.writeHead(404)
    res.end()
  })

  io.attach(httpServer)
  httpServer.listen(port)

  io.engine.on('connection_error', (err) => {
    console.log('❌ Error de engine: ', err.message)
  })

  console.log(`🚀 Servidor de salas corriendo en el puerto ${port}`)

  // Graceful shutdown. SIGINT llega de pm2/ctrl-c, SIGTERM es lo que manda Docker/Coolify al redeployar.
  const cerrarServer = () => {
    console.log('\n📡 Cerrando server...')
    io.close(() => {
      console.log('Server cerrado!')
      process.exit(0)
    })
  }
  process.on('SIGINT', cerrarServer)
  process.on('SIGTERM', cerrarServer)

  // Última línea de error handling
  process.on('uncaughtException', (error) => {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  })

  // Promises sin catch
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Rejeccion inesperada en:', promise, 'reason:', reason)
    process.exit(1)
  })
}
