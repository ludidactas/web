import { Server } from 'socket.io'

/** Crea el socket y le registra los eventos base */
export const mount = (port: number) => {
  const io = new Server({
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    // serveClient: false
  })

  // Start the server
  io.listen(port)

  io.engine.on('connection_error', (err) => {
    console.log('❌ Error de engine: ', err.message)
  })

  console.log(`🚀 Servidor de salas corriendo en el puerto ${port}`)

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📡 Cerrando server...')
    io.close(() => {
      console.log('Server cerrado!')
      process.exit(0)
    })
  })

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

  return io
}
