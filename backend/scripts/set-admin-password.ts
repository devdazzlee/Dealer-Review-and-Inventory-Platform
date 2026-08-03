import { ensureAdminAccount } from "../src/services/admin-auth.service";
import { prisma } from "../src/lib/prisma";

/** New dashboard password — stored hashed in AdminAccount only. */
const PASSWORD = "AsrAdmin#2026!";

async function main() {
  await ensureAdminAccount(PASSWORD);
  console.log(`Admin password updated in DB. Login with: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
