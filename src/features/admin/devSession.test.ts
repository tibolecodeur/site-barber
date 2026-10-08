import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, signIn } from "@/features/admin/data";
import {
  clearDevSession,
  isDevSessionEnabled,
  readDevSession,
  writeDevSession,
} from "@/features/admin/devSession";

const STORAGE_KEY = "cutsbyalix:dev-admin-session";

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("faux état connecté en développement", () => {
  it("est disponible et se lit dans sessionStorage", () => {
    expect(isDevSessionEnabled()).toBe(true);
    writeDevSession("alix@example.com");
    expect(readDevSession()).toBe("alix@example.com");
    clearDevSession();
    expect(readDevSession()).toBeNull();
  });

  it("reste déconnecté si le stockage est refusé (navigation privée stricte)", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("refusé", "SecurityError");
    });
    expect(readDevSession()).toBeNull();
    spy.mockRestore();
  });
});

/**
 * Production simulée : `vi.stubEnv` change `import.meta.env.DEV` pendant le test.
 * Preuve complémentaire, sur le vrai fichier livré : devSession.build.test.ts.
 */
describe("faux état connecté en production (DEV = false)", () => {
  beforeEach(() => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);
  });

  it("ignore une session factice déjà présente dans le stockage", async () => {
    sessionStorage.setItem(STORAGE_KEY, "intrus@example.com");
    expect(isDevSessionEnabled()).toBe(false);
    expect(readDevSession()).toBeNull();
    expect(await getSession()).toBeNull();
  });

  it("refuse toute connexion et toute écriture de session", async () => {
    await expect(signIn("alix@example.com", "secret")).rejects.toMatchObject({
      code: "not_connected",
    });
    expect(() => writeDevSession("alix@example.com")).toThrow();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    clearDevSession();
  });
});
