import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashDemoPassword, prepareDemoLoginUpdate, verifyDemoPassword } from "@/lib/demo-login-crypto.server";

const password = "secure-demo-password";
const salt = "00112233445566778899aabbccddeeff";
const expectedHash = "218114916747e77c1a8ab0d4612081099f42fa46794e3aa5b38b6aa876188559";

describe("demo password hashing", () => {
  it("derives a PBKDF2-SHA256 hash with the supported 210,000-iteration work factor", async () => {
    const result = await hashDemoPassword(password, salt);
    assert.equal(result.salt, salt);
    assert.equal(result.hash, expectedHash);
    assert.equal(await verifyDemoPassword(password, salt, expectedHash), true);
    assert.equal(await verifyDemoPassword("wrong-password", salt, expectedHash), false);
  });

  it("retains an existing password hash without rehashing when profile or username details change", async () => {
    const existingLogin = { password_salt: salt, password_hash: expectedHash };
    let hashCalls = 0;
    const result = await prepareDemoLoginUpdate({
      username: "updated-demo-user",
      password: "",
      existingLogin,
    }, async () => {
      hashCalls += 1;
      return { salt: "unexpected", hash: "unexpected" };
    });
    assert.deepEqual(result, {
      username: "updated-demo-user",
      passwordSalt: salt,
      passwordHash: expectedHash,
    });
    assert.equal(hashCalls, 0);
  });

  it("creates a new salted hash only when a new password is provided", async () => {
    let hashCalls = 0;
    const result = await prepareDemoLoginUpdate({
      username: "demo-user",
      password,
      fallbackUsername: "demo-user",
    }, async (newPassword) => {
      hashCalls += 1;
      return hashDemoPassword(newPassword, salt);
    });
    assert.ok(result);
    assert.equal(hashCalls, 1);
    assert.equal(result.passwordSalt, salt);
    assert.equal(await verifyDemoPassword(password, result.passwordSalt, result.passwordHash), true);
  });

  it("does not create or hash credentials for unchanged environment-backed sign-in details", async () => {
    const result = await prepareDemoLoginUpdate({
      username: "demo-user",
      password: "",
      fallbackUsername: "demo-user",
    });
    assert.equal(result, null);
  });

  it("requires a new password when changing username before a saved hash exists", async () => {
    await assert.rejects(
      prepareDemoLoginUpdate({
        username: "new-user",
        password: "",
        fallbackUsername: "demo-user",
      }),
      /Enter a new password/,
    );
  });
});