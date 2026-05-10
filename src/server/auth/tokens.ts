import { createHash, createHmac, randomBytes } from "node:crypto";
import { getOptionalEnv } from "@/lib/env";

export function createToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  const secret = getOptionalEnv("SESSION_SECRET");

  if (secret) {
    return createHmac("sha256", secret).update(token).digest("hex");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }

  return createHash("sha256").update(token).digest("hex");
}
