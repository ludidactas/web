import { io } from './io'

/** Pone el `io` a escuchar en `port` y le registra los eventos base y el cierre ordenado. */
export const mount = (port: number) => {
  io.listen(port)

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
