"use server";

import { redirect } from "next/navigation";
import { getOptionalEnv } from "@/lib/env";
import { prisma } from "@/server/db";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/server/auth/validation";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import { createToken, hashToken } from "@/server/auth/tokens";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "@/server/email/mailer";

const PASSWORD_RESET_MINUTES = 30;

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Please enter a valid email and an 8+ character password." };
  }

  const email = parsed.data.email.toLowerCase();
  const displayName =
    parsed.data.displayName?.trim() || email.slice(0, email.indexOf("@"));

  try {
    const user = await prisma.user.create({
      data: {
        email,
        displayName,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });

    try {
      await sendWelcomeEmail({
        email: user.email,
        displayName: user.displayName,
      });
    } catch (error) {
      console.error("Failed to send welcome email", error);
    }

    await createSession(user.id);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "An account already exists for this email." };
    }

    return { error: "Registration failed. Please try again." };
  }

  redirect("/books");
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Please enter your email and password." };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email.toLowerCase(),
    },
  });

  if (
    !user ||
    !(await verifyPassword({
      password: parsed.data.password,
      passwordHash: user.passwordHash,
    }))
  ) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/books");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Please enter a valid email address." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = createToken();
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000,
    );

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });

    const appUrl = getOptionalEnv("APP_URL") ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail({ email: user.email, resetUrl });
  }

  return {
    success:
      "If that email exists in SharingBill, a password reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "The reset link or password is invalid." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash: hashToken(parsed.data.token),
    },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return { error: "This reset link is invalid or expired." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
      },
    }),
    prisma.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),
    prisma.session.deleteMany({
      where: {
        userId: resetToken.userId,
      },
    }),
  ]);

  return { success: "Password reset. You can now log in." };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
