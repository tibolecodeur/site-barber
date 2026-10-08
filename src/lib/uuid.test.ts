import { afterEach, describe, expect, it, vi } from "vitest";
import { randomUuid } from "@/lib/uuid";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("randomUuid", () => {
  it("utilise crypto.randomUUID quand il existe (contexte sécurisé)", () => {
    const randomUUID = vi.fn(() => "11111111-1111-4111-8111-111111111111");
    vi.stubGlobal("crypto", { randomUUID, getRandomValues: vi.fn() });
    expect(randomUuid()).toBe("11111111-1111-4111-8111-111111111111");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("se replie sur crypto.getRandomValues en http (randomUUID absent)", () => {
    const getRandomValues = vi.fn(<T extends ArrayBufferView>(bytes: T) => {
      (bytes as unknown as Uint8Array).fill(0xff);
      return bytes;
    });
    vi.stubGlobal("crypto", { getRandomValues });
    const id = randomUuid();
    expect(getRandomValues).toHaveBeenCalledOnce();
    // Octets à 0xff : seuls les bits de version (4) et de variante (8–b) sont forcés.
    expect(id).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    expect(id).toMatch(UUID_V4);
  });

  it("produit des uuid v4 valides et distincts, même sans aucune API crypto", () => {
    vi.stubGlobal("crypto", undefined);
    const ids = new Set(Array.from({ length: 200 }, () => randomUuid()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(UUID_V4);
  });
});
