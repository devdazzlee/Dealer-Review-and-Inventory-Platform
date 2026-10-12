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
      // Photo resizing peaks above 512M; at that limit PM2 restarted it
      // mid-sync, the restart collided with the old process and PM2 left
      // the API down for three days (Oct 2026). The VPS has 4GB.
      max_memory_restart: "1G",
      // Time to finish the graceful shutdown before SIGKILL (default 1.6s).
      kill_timeout: 10000,
      // Keep retrying a failed start, backing off up to 15s, instead of
      // stopping in "errored".
      exp_backoff_restart_delay: 1000,
      max_restarts: 1000,
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
