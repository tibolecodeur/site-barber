import { describe, expect, it } from "vitest";
import { PROVISIONAL_SERVICES } from "@/features/booking/provisionalServices";

describe("PROVISIONAL_SERVICES", () => {
  it("contient les deux prestations de la spec, sans prix inventé", () => {
    expect(PROVISIONAL_SERVICES.map((s) => s.name)).toEqual(["Coupe", "Coupe + barbe"]);
    for (const service of PROVISIONAL_SERVICES) {
      expect(service.durationMin).toBe(60);
      expect(service.priceLabel).toBe("À confirmer");
    }
  });

  it("a des identifiants uniques (utilisés comme `key` React et valeur de formulaire)", () => {
    const ids = PROVISIONAL_SERVICES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
