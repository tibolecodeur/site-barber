import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabase, resetSupabaseClient, SupabaseConfigError } from "@/lib/supabase";

// On ne crée jamais de vrai client : on vérifie seulement comment il serait créé.
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ fake: true })) }));

// Valeurs factices : aucune vraie URL ni clé dans les tests.
const FAKE_URL = "https://projet-factice.supabase.test";
const FAKE_KEY = "cle-anon-factice";

beforeEach(() => {
  resetSupabaseClient();
  vi.mocked(createClient).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSupabase", () => {
  it("lève une SupabaseConfigError lisible si l'URL manque", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", FAKE_KEY);
    expect(() => getSupabase()).toThrow(SupabaseConfigError);
    expect(() => getSupabase()).toThrow(/VITE_SUPABASE_URL/);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("lève une SupabaseConfigError si la clé manque ou n'est faite que d'espaces", () => {
    vi.stubEnv("VITE_SUPABASE_URL", FAKE_URL);
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "   ");
    expect(() => getSupabase()).toThrow(SupabaseConfigError);
  });

  it("crée un seul client, sans session persistante", () => {
    vi.stubEnv("VITE_SUPABASE_URL", FAKE_URL);
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", FAKE_KEY);

    const first = getSupabase();
    expect(getSupabase()).toBe(first);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(FAKE_URL, FAKE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  });
});
