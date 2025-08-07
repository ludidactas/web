// Configuración para correr pm2 en el VPS
module.exports = {
  apps: [
    {
      name: 'polls',
      script: 'bun',
      args: 'polls/server.ts',
      cwd: '/home/vlad/poc_roadmaps/',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
