// PM2 configuration: keeps the Express API running and restarts it on crash or reboot.
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'cloudvault-api',
      cwd: path.join(__dirname, '..', 'server'),
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
