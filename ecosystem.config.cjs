module.exports = {
  apps: [{
    name: 'tg-desktop-controller',
    script: 'src/index.mjs',
    cwd: '/mnt/data/reps/tg-desktop-controller',
    interpreter: 'node',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 2000,
    max_restarts: 50,
    min_uptime: '10s',
    listen_timeout: 5000,
    kill_timeout: 3000,
    ignore_watch: ["node_modules", "logs", "*.log"]
  }]
}; 