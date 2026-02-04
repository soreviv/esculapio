// PM2 Configuration File for Salud Digital
module.exports = {
  apps: [{
    name: 'salud-digital',
    script: './dist/index.cjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/log/pm2/salud-digital-error.log',
    out_file: '/var/log/pm2/salud-digital-out.log',
    merge_logs: true,
    // Restart policy
    exp_backoff_restart_delay: 100,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
