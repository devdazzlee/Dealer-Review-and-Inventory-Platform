import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPasswordHash } from "../utils/password";
import { UnauthorizedError, ValidationError, ConflictError, NotFoundError } from "../errors/AppError";
import { emailService } from "./email.service";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export class DealerAuthService {
  /**
   * Admin-only: issues (or resets) portal login credentials for a dealer, or
   * updates just the login email for a dealer that already has access.
   * There is no dealer self-registration — an admin always sets the first
   * password, same trust model as the rest of the admin-managed platform.
   *
   * `password` omitted = email-only update. Requires the dealer to already
   * have access (a password set); the existing password and active sessions
   * are left untouched, and the dealer is notified at the new address.
   * `password` provided = (re)issues a password, same as granting fresh
   * access — revokes existing sessions and emails the new credentials.
   */
  async setCredentials(dealerId: string, loginEmail: string, password?: string) {
    const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundError("Dealer");

    const email = loginEmail.trim().toLowerCase();
    const existing = await prisma.dealer.findUnique({
      where: { loginEmail: email },
      select: { id: true },
    });
    if (existing && existing.id !== dealerId) {
      throw new ConflictError(
        "That login email is already in use by another dealer"
      );
    }

    if (!password) {
      if (!dealer.passwordHash) {
        throw new ValidationError(
          "This dealer doesn't have portal access yet — set a password to grant it"
        );
      }
      if (dealer.loginEmail === email) {
        return { success: true };
      }

      await prisma.dealer.update({
        where: { id: dealerId },
        data: { loginEmail: email },
      });

      void emailService
        .sendDealerPortalEmailChanged({ dealerName: dealer.name, loginEmail: email })
        .catch((err) =>
          console.error("[email] dealer portal email-change notice failed:", err)
        );

      return { success: true };
    }

    const passwordHash = await hashPassword(password);
    await prisma.dealer.update({
      where: { id: dealerId },
      data: { loginEmail: email, passwordHash },
    });
    // Revoking every existing session forces re-login with the new password.
    await prisma.dealerSession.deleteMany({ where: { dealerId } });

    // Fire-and-forget — a slow or failed SMTP send shouldn't block the admin
    // from seeing "access granted" (the credentials are also shown in the
    // admin UI as a fallback either way).
    void emailService
      .sendDealerPortalCredentials({
        dealerName: dealer.name,
        loginEmail: email,
        password,
      })
      .catch((err) =>
        console.error("[email] dealer portal credentials send failed:", err)
      );

    return { success: true };
  }

  async revokeAccess(dealerId: string) {
    await prisma.dealer.update({
      where: { id: dealerId },
      data: { loginEmail: null, passwordHash: null },
    });
    await prisma.dealerSession.deleteMany({ where: { dealerId } });
    return { success: true };
  }

  async login(loginEmail: string, password: string) {
    const email = loginEmail.trim().toLowerCase();
    const dealer = await prisma.dealer.findUnique({ where: { loginEmail: email } });

    if (!dealer || !dealer.passwordHash) {
      throw new UnauthorizedError("Incorrect email or password");
    }
    if (!(await verifyPasswordHash(password, dealer.passwordHash))) {
      throw new UnauthorizedError("Incorrect email or password");
    }

    const token = generateSessionToken();
    await prisma.dealerSession.create({
      data: {
        token,
        dealerId: dealer.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    return { token, dealerId: dealer.id, dealerName: dealer.name, slug: dealer.slug };
  }

  async logout(token: string) {
    await prisma.dealerSession.deleteMany({ where: { token } });
    return { success: true };
  }

  /** Returns the authenticated dealerId, or null if the token is missing/expired. */
  async verifySession(token: string): Promise<string | null> {
    const session = await prisma.dealerSession.findUnique({ where: { token } });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      // Expired — clean it up lazily rather than running a sweep job.
      await prisma.dealerSession.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    return session.dealerId;
  }

  async changeOwnPassword(
    dealerId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer?.passwordHash) {
      throw new UnauthorizedError("Portal access is not set up for this dealer");
    }
    if (!(await verifyPasswordHash(currentPassword, dealer.passwordHash))) {
      throw new UnauthorizedError("Current password is incorrect");
    }
    if (currentPassword === newPassword) {
      throw new ValidationError(
        "New password must be different from the current password"
      );
    }
    const passwordHash = await hashPassword(newPassword);
    await prisma.dealer.update({ where: { id: dealerId }, data: { passwordHash } });
    // Keep the session that just authenticated this change alive — only
    // drop other sessions so old devices are signed out.
    return { success: true };
  }
}

export const dealerAuthService = new DealerAuthService();
