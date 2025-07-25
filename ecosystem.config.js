module.exports = {
  apps: [{
    name: 'polls',
    script: 'polls/server.ts',
    interpreter: 'bun',
    cwd: '/home/vlad/poc_roadmaps/',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
