import "dotenv/config";
import app from "./app";
import { env, isEmailConfigured } from "./config/env";
import { prisma } from "./lib/prisma";
import { startScheduledJobs } from "./services/jobs.service";

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
  console.log(
    isEmailConfigured()
      ? `Email SMTP configured (${env.email.host}) → admins: ${env.email.adminRecipients.join(", ")}`
      : "Email SMTP not configured — review emails will be skipped"
  );
  startScheduledJobs();
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);
  // server.close waits for every keep-alive connection; don't let that hang
  // past PM2's kill_timeout (10s), or PM2 starts a new copy while this one
  // still holds the pid and gives up with "process already exists".
  setTimeout(() => process.exit(0), 8_000).unref();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
