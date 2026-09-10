module.exports = {
  apps: [
    {
      name: "asr-backend",
      cwd: "/var/www/autosalesreviews/backend",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "4100",
      },
      max_memory_restart: "512M",
    },
    {
      name: "asr-frontend",
      cwd: "/var/www/autosalesreviews/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        // Loaded from frontend/.env.local by Next, and also set by deploy
        // host env / PM2 when needed:
        // NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, INTERNAL_API_KEY, API_INTERNAL_URL
      },
      max_memory_restart: "512M",
    },
  ],
};
