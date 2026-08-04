// Configuración para correr pm2 en el VPS
module.exports = {
  apps: [
    {
      name: 'wss',
      script: 'bun',
      args: 'wss/server.ts',
      cwd: '/home/vlad/web/',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
