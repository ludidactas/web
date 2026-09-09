import { randomBytes } from 'crypto'
import { io, Socket } from 'socket.io-client'
import redis from '../redis'
import { getSala } from '../salas/db'
import { nombreDeFantasia } from '../salas/utils'
import { MetodosLogin } from '../validators/auth'
import { agregarPermitidosA, quitarPermitidosDe } from '../invitados/db'

const WSS_HOST = process.env.WSS_HOST ?? 'http://localhost:3005'

function extraerIdSala(input: string): string {
  try {
    const url = new URL(input)
    const match = url.pathname.match(/\/sala\/([^/]+)/)
    if (match) return match[1]
  } catch {}
  return input
}

function generarClientId(): string {
  return randomBytes(16).toString('hex')
}

function generarDni(): string {
  return String(10_000_000 + Math.floor(Math.random() * 90_000_000))
}

function nombresUnicos(n: number): string[] {
  const usados = new Set<string>()
  const resultado: string[] = []
  while (resultado.length < n) {
    let nombre = nombreDeFantasia()
    if (usados.has(nombre)) {
      nombre = `${nombre} ${resultado.length + 1}`
    }
    usados.add(nombre)
    resultado.push(nombre)
  }
  return resultado
}

function conectar(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout de conexión')), 5000)
    socket.on('connect', () => {
      clearTimeout(timeout)
      resolve()
    })
    socket.on('connect_error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
    socket.connect()
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// --- Main ---

const inputSala = process.argv[2]
const cantidad = parseInt(process.argv[3] ?? '10', 10)

if (!inputSala) {
  console.error('Uso: bun run wss:simular <url-o-idSala> [cantidad]')
  process.exit(1)
}

const idSala = extraerIdSala(inputSala)

const sala = await getSala(idSala)
if (!sala) {
  console.error(`No existe la sala ${idSala}`)
  await redis.quit()
  process.exit(1)
}

const metodo = sala.config.metodo_login
const soloInvitados = sala.config.solo_invitados
console.log(`Sala ${idSala} — metodo: ${metodo}, solo_invitados: ${soloInvitados}`)

if (metodo === MetodosLogin.Google) {
  console.error('metodo_login "google" no soportado por este script (requiere JWT)')
  await redis.quit()
  process.exit(1)
}

const nombres = nombresUnicos(cantidad)
const dnis = metodo === MetodosLogin.DNI ? Array.from({ length: cantidad }, () => generarDni()) : []
const clientIds = Array.from({ length: cantidad }, () => generarClientId())

if (metodo === MetodosLogin.DNI && soloInvitados) {
  await agregarPermitidosA(dnis, idSala)
  console.log(`Inyectados ${dnis.length} DNIs en allowed_list`)
}

const sockets: Socket[] = []
const estados: string[] = []

for (let i = 0; i < cantidad; i++) {
  const auth: Record<string, string> = {
    rol: 'estudiante',
    idSala,
    nombre: nombres[i],
    clientId: clientIds[i],
  }
  if (metodo === MetodosLogin.DNI) {
    auth.dni = dnis[i]
  }

  const socket = io(WSS_HOST, { auth, autoConnect: false, reconnection: false })
  sockets.push(socket)

  try {
    await conectar(socket)
    estados.push('conectado')
  } catch (err: any) {
    estados.push(`error: ${err.message}`)
    if (i === 0) {
      console.error(`Fallo en primera conexión: ${err.message}`)
      console.error('Abortando.')
      await redis.quit()
      process.exit(1)
    }
  }

  if (i < cantidad - 1) await sleep(50)
}

console.log('\n#\tNombre\t\t\t\tDNI\t\tclientId\tEstado')
console.log('-'.repeat(100))
for (let i = 0; i < cantidad; i++) {
  const dni = dnis[i] ?? '-'
  const cid = clientIds[i].slice(0, 8) + '...'
  console.log(`${i + 1}\t${nombres[i].padEnd(28)}\t${dni}\t\t${cid}\t\t${estados[i]}`)
}

const conectados = estados.filter((e) => e === 'conectado').length
console.log(`\n${conectados}/${cantidad} estudiantes conectados a sala ${idSala}`)
console.log('Ctrl+C para desconectar y salir.\n')

async function cleanup() {
  console.log('\nDesconectando...')
  for (const socket of sockets) {
    socket.disconnect()
  }

  if (metodo === MetodosLogin.DNI && soloInvitados && dnis.length > 0) {
    await quitarPermitidosDe(dnis, idSala)
    console.log(`Removidos ${dnis.length} DNIs de allowed_list`)
  }

  await redis.quit()
  console.log(`${conectados} estudiantes desconectados.`)
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
