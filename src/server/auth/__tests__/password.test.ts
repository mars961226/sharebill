import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  it("verifies a matching password", async () => {
    const passwordHash = await hashPassword("correct-password");

    await expect(
      verifyPassword({
        password: "correct-password",
        passwordHash,
      }),
    ).resolves.toBe(true);
  });

  it("rejects a non-matching password", async () => {
    const passwordHash = await hashPassword("correct-password");

    await expect(
      verifyPassword({
        password: "wrong-password",
        passwordHash,
      }),
    ).resolves.toBe(false);
  });
});
