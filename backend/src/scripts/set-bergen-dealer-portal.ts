import "dotenv/config";
import { dealerAuthService } from "../services/dealer-auth.service";
import { prisma } from "../lib/prisma";

async function main() {
  const dealer = await prisma.dealer.findUnique({ where: { slug: "bergen-car" } });
  if (!dealer) {
    throw new Error('Dealer with slug "bergen-car" not found');
  }

  const loginEmail = "bergen@bergenmotors.com";
  const password = "Bergen2026";
  await dealerAuthService.setCredentials(dealer.id, loginEmail, password);
  console.log("Dealer portal access set for:", dealer.name);
  console.log("Login email:", loginEmail);
  console.log("Password:", password);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
