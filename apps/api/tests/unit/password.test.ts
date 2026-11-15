import { expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/auth/password";
it("salts hashes and verifies credentials", async () => {
  const first = await hashPassword("secret");
  const second = await hashPassword("secret");
  expect(first).not.toBe(second);
  expect(await verifyPassword("secret", first)).toBe(true);
  expect(await verifyPassword("wrong", first)).toBe(false);
});
