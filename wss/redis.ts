import Redis from 'ioredis'

// Se asume que hay un server redis corriendo
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
})

redis.on('error', (err) => console.error('❌ Redis tiró error:', err))

export default redis
