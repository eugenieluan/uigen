// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";

// Hoist cookieJar so it's accessible inside the mock factory (which runs before imports)
const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value ? { value } : undefined;
    },
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  })),
}));

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";
import type { NextRequest } from "next/server";

beforeEach(() => {
  cookieJar.clear();
});

function makeRequest(token?: string): NextRequest {
  return {
    cookies: {
      get: (name: string) =>
        name === "auth-token" && token ? { value: token } : undefined,
    },
  } as unknown as NextRequest;
}

// --- getSession ---

test("getSession returns null when no cookie is set", async () => {
  expect(await getSession()).toBeNull();
});

test("getSession returns null for a malformed token", async () => {
  cookieJar.set("auth-token", "not-a-valid-jwt");
  expect(await getSession()).toBeNull();
});

// --- createSession + getSession ---

test("createSession sets the auth-token cookie", async () => {
  await createSession("user-1", "user@example.com");
  expect(cookieJar.has("auth-token")).toBe(true);
});

test("createSession produces a token that getSession can read back", async () => {
  await createSession("user-1", "user@example.com");

  const session = await getSession();
  expect(session).not.toBeNull();
  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("user@example.com");
  expect(session?.expiresAt).toBeDefined();
});

test("createSession stores different users independently", async () => {
  await createSession("user-A", "a@example.com");
  const sessionA = await getSession();
  expect(sessionA?.userId).toBe("user-A");

  // Overwrite with a new session
  await createSession("user-B", "b@example.com");
  const sessionB = await getSession();
  expect(sessionB?.userId).toBe("user-B");
  expect(sessionB?.email).toBe("b@example.com");
});

// --- deleteSession ---

test("deleteSession removes the cookie", async () => {
  await createSession("user-1", "user@example.com");
  await deleteSession();
  expect(cookieJar.has("auth-token")).toBe(false);
});

test("getSession returns null after deleteSession", async () => {
  await createSession("user-1", "user@example.com");
  await deleteSession();
  expect(await getSession()).toBeNull();
});

// --- verifySession ---

test("verifySession returns null when request has no cookie", async () => {
  const session = await verifySession(makeRequest());
  expect(session).toBeNull();
});

test("verifySession returns null for a malformed token", async () => {
  const session = await verifySession(makeRequest("bad-token"));
  expect(session).toBeNull();
});

test("verifySession returns the session payload for a valid token", async () => {
  await createSession("user-2", "verify@example.com");
  const token = cookieJar.get("auth-token")!;

  const session = await verifySession(makeRequest(token));
  expect(session).not.toBeNull();
  expect(session?.userId).toBe("user-2");
  expect(session?.email).toBe("verify@example.com");
});
