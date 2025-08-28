'use client'
import { useServerWebsockets } from '../components/use-server-encuestas'
import { Button } from '@/components/ui/button'
import { toast, Toaster } from 'sonner'
import { useEffect } from 'react'
import { RolEncuesta } from '@/wss/tipos'

export default function PingClient() {
  const { socket, ...resto } = useServerWebsockets({ nombre: 'pingo', rol: RolEncuesta.Tester })

  useEffect(() => {
    if (!socket) return
    socket.on('pong', (data: any) => {
      console.log('Data del pong:', data)
      toast.success(`Pong!`)
    })
    return () => {
      socket.off('pong')
    }
  }, [socket])

  return (
    <div className="p-8">
      <Toaster />
      <pre>Error: {resto.error}</pre>
      <pre>Conectado: {JSON.stringify(resto.conectado)}</pre>
      <pre>Conectando: {JSON.stringify(resto.conectando)}</pre>
      {socket && (
        <>
          <pre>{JSON.stringify(resto, null, 2)}</pre>
          <pre>Socket active?: {JSON.stringify(socket.active, null, 2)}</pre>
          <pre>Socket connected?: {JSON.stringify(socket.connected, null, 2)}</pre>
          <pre>Socket recovered?: {JSON.stringify(socket.recovered, null, 2)}</pre>
          <pre>Socket id: {JSON.stringify(socket.id, null, 2)}</pre>
          <pre>Socket auth: {JSON.stringify(socket.auth, null, 2)}</pre>
        </>
      )}
      <Button onClick={() => socket?.emit('ping', { mensaje: 'ping desde el cliente' })}>Enviar ping</Button>
    </div>
  )
}
