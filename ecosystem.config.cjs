module.exports = {
  apps: [
    {
      name: 'spa-crawler',
      script: 'index.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G'
    }
  ]
}
