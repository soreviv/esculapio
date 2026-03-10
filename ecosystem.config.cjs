// PM2 Configuration File for Salud Digital
module.exports = {
  apps: [{
    name: 'salud-digital',
    script: './dist/index.cjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_production: {
    NODE_ENV: 'production',
    PORT: 5000,
    DATABASE_URL: 'postgresql://salud_digital:Lola5109@localhost:5432/salud_digital',
    SESSION_SECRET: '970182f8d80017c01fbed37468b67b80ee0eccb577c4faa9a05f223c0e799457',
    ADMIN_PASSWORD: 'AdminSeguro2026!'
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
