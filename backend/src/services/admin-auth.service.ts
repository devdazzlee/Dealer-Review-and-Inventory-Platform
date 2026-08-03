import { prisma } from "../lib/prisma";
import { UnauthorizedError, ValidationError } from "../errors/AppError";
import { hashPassword, verifyPasswordHash } from "../utils/password";

const ADMIN_ACCOUNT_ID = "admin";

async function getStoredPasswordHash(): Promise<string | null> {
  const row = await prisma.adminAccount.findUnique({
    where: { id: ADMIN_ACCOUNT_ID },
  });
  return row?.passwordHash ?? null;
}

/** Admin password lives only in AdminAccount — never read from .env. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const stored = await getStoredPasswordHash();
  if (!stored) {
    return false;
  }
  return verifyPasswordHash(password, stored);
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const stored = await getStoredPasswordHash();
  if (!stored) {
    throw new UnauthorizedError(
      "Admin account is not initialized. Run the database seed."
    );
  }

  if (!(await verifyPasswordHash(currentPassword, stored))) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw new ValidationError(
      "New password must be different from the current password"
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.adminAccount.update({
    where: { id: ADMIN_ACCOUNT_ID },
    data: { passwordHash },
  });
}

/** Upsert the singleton admin row (used by seed / bootstrap). */
export async function ensureAdminAccount(password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await prisma.adminAccount.upsert({
    where: { id: ADMIN_ACCOUNT_ID },
    create: { id: ADMIN_ACCOUNT_ID, passwordHash },
    update: { passwordHash },
  });
}
