import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";

const encoder = new TextEncoder();

const DEMO_PASSWORD_ITERATIONS = 210_000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export async function hashDemoPassword(password: string, saltHex?: string) {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2Async(sha256, encoder.encode(password), salt, {
    c: DEMO_PASSWORD_ITERATIONS,
    dkLen: 32,
  });
  return { salt: toHex(salt), hash: toHex(derived) };
}

export async function verifyDemoPassword(password: string, saltHex: string, expectedHash: string) {
  const actual = await hashDemoPassword(password, saltHex);
  if (actual.hash.length !== expectedHash.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.hash.length; index += 1) {
    difference |= actual.hash.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  }
  return difference === 0;
}

export type ExistingDemoLogin = { password_salt: string; password_hash: string };

export async function prepareDemoLoginUpdate(input: {
  username: string;
  password: string;
  existingLogin?: ExistingDemoLogin | null;
  fallbackUsername?: string;
}, hashPassword: typeof hashDemoPassword = hashDemoPassword) {
  if (input.password) {
    const hashed = await hashPassword(input.password);
    return { username: input.username, passwordSalt: hashed.salt, passwordHash: hashed.hash };
  }

  if (input.existingLogin) {
    return {
      username: input.username,
      passwordSalt: input.existingLogin.password_salt,
      passwordHash: input.existingLogin.password_hash,
    };
  }

  if (input.username !== input.fallbackUsername) {
    throw new Error("Enter a new password to change the username before a saved demo password exists.");
  }

  return null;
}
