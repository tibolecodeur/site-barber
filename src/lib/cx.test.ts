import { describe, expect, it } from "vitest";
import { cx } from "@/lib/cx";

describe("cx", () => {
  it("assemble les classes dans l'ordre, séparées par une espace", () => {
    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("ignore false, null, undefined et les chaînes vides", () => {
    const actif = false;
    expect(cx("a", actif && "b", null, undefined, "", "c")).toBe("a c");
  });

  it("renvoie une chaîne vide sans classe", () => {
    expect(cx()).toBe("");
  });
});
