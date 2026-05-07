import nodemailer from "nodemailer";
import { getOptionalEnv } from "@/lib/env";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(message: EmailMessage): Promise<void> {
  const host = getOptionalEnv("SMTP_HOST");
  const port = Number(getOptionalEnv("SMTP_PORT") ?? "1025");
  const from = getOptionalEnv("SMTP_FROM") ?? "ShareBill <noreply@sharebill.local>";

  if (!host) {
    console.info(`[email skipped] ${message.subject} -> ${message.to}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
  });

  await transporter.sendMail({
    from,
    ...message,
  });
}

export async function sendWelcomeEmail({
  email,
  displayName,
}: {
  email: string;
  displayName: string;
}): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Welcome to ShareBill",
    text: `Hi ${displayName}, welcome to ShareBill.`,
  });
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Reset your ShareBill password",
    text: `Open this link to reset your password: ${resetUrl}`,
  });
}
