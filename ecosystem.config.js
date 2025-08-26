module.exports = {
  apps: [
    {
      name: 'garapa-web',
      script: 'npm',
      args: 'start',
      cwd: '/home/app/GarapaSystem-MVP',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/crm_mvp',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'your-secret-key'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/app/GarapaSystem-MVP/logs/garapa-web-error.log',
      out_file: '/home/app/GarapaSystem-MVP/logs/garapa-web-out.log',
      log_file: '/home/app/GarapaSystem-MVP/logs/garapa-web.log'
    },
    {
      name: 'garapa-webhook-worker',
      script: 'tsx',
      args: 'src/workers/webhook-worker.ts',
      cwd: '/home/app/GarapaSystem-MVP',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/crm_mvp'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: '/home/app/GarapaSystem-MVP/logs/garapa-webhook-worker-error.log',
      out_file: '/home/app/GarapaSystem-MVP/logs/garapa-webhook-worker-out.log',
      log_file: '/home/app/GarapaSystem-MVP/logs/garapa-webhook-worker.log'
    },
    {
      name: 'garapa-email-sync',
      script: 'tsx',
      args: 'src/workers/email-sync.ts',
      cwd: '/home/app/GarapaSystem-MVP',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/crm_mvp'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: '/home/app/GarapaSystem-MVP/logs/garapa-email-sync-error.log',
      out_file: '/home/app/GarapaSystem-MVP/logs/garapa-email-sync-out.log',
      log_file: '/home/app/GarapaSystem-MVP/logs/garapa-email-sync.log'
    }
  ],

  deploy: {
    production: {
      user: 'app',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:garapadev/GarapaSystem-MVP.git',
      path: '/home/app/GarapaSystem-MVP',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};