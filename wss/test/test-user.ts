import { io } from 'socket.io-client'
import { setupSocketLogging, sleep } from './test-funcs'

// const host = process.env.HOST || 'localhost';
// const puerto = process.env.PORT && parseInt(process.env.PORT) || 3005;
const host = 'localhost'
const puerto = 3005

console.log(`🔌 Connecting to server at http://${host}:${puerto}...`)

// Connect to your server
const { socket, localPolls } = await setupSocketLogging(io(`http://${host}:${puerto}`))

function vote(pollId: string, optionId: number) {
  socket.emit('poll:vote', { pollId, optionId })
}

socket.on('poll:list', (polls) => {
  console.log('\n📋 Puedo elegir entre:', polls)
})

console.log('🧪 Test user started')

await sleep(1000)

// Votamos una opción al azar de la primera encuesta que hayga

const encuestas = Array.from(localPolls.values())
console.log(`\n🗳️  Las encuestas disponibles son: ${JSON.stringify(encuestas)}`)

if (encuestas.length === 0) {
  console.error('❌ No hay encuestas disponibles para votar.')
  process.exit(1)
}

const idPrimera = encuestas[0]!.id
const opcionesPrimera = encuestas[0]!.opciones

if (opcionesPrimera.length === 0) {
  console.error('❌ No hay opciones disponibles para votar.')
  process.exit(1)
}

const opcion = opcionesPrimera[Math.floor(Math.random() * opcionesPrimera.length)]

console.log('\n🗳️  Votando en la encuesta 1, opción random...')

vote(idPrimera, opcion!.id)

await sleep(10 * 1000)

console.log('🧪 Test user ended')
