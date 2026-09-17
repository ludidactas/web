import Redis from 'ioredis'

// Se asume que hay un server redis corriendo
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: (process.env.REDIS_PORT && parseInt(process.env.REDIS_PORT)) || 6379,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
})

redis.on('error', (err) => console.error('❌ Redis tiró error:', err))

export default redis
