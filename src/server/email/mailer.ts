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
  const user = getOptionalEnv("SMTP_USER");
  const pass = getOptionalEnv("SMTP_PASS");
  const resendApiKey = getOptionalEnv("RESEND_API_KEY");
  const from = getOptionalEnv("SMTP_FROM") ?? "SharingBill <noreply@sharingbill.local>";

  if (resendApiKey) {
    await sendWithResend({ from, message, apiKey: resendApiKey });
    return;
  }

  if (!host) {
    console.info(`[email skipped] ${message.subject} -> ${message.to}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: getOptionalEnv("SMTP_SECURE") === "true",
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  await transporter.sendMail({
    from,
    ...message,
  });
}

async function sendWithResend({
  from,
  message,
  apiKey,
}: {
  from: string;
  message: EmailMessage;
  apiKey: string;
}): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend API error ${response.status}: ${details}`);
  }
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
    subject: "Welcome to SharingBill",
    text: `Hi ${displayName}, welcome to SharingBill.`,
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
    subject: "Reset your SharingBill password",
    text: `Open this link to reset your password: ${resetUrl}`,
  });
}
