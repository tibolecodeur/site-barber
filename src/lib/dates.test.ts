import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  dayKeyParts,
  formatDayKey,
  formatLongDay,
  formatTime,
  isoWeekday,
  parisDateTime,
  parisDayKey,
} from "@/lib/dates";

describe("parisDateTime", () => {
  it("convertit une heure de Paris en instant UTC, l'hiver (+1) et l'été (+2)", () => {
    expect(parisDateTime("2026-01-15", "14:00").toISOString()).toBe("2026-01-15T13:00:00.000Z");
    expect(parisDateTime("2026-07-15", "14:00").toISOString()).toBe("2026-07-15T12:00:00.000Z");
  });

  it("gère les jours de changement d'heure", () => {
    // 29 mars 2026 : 2 h → 3 h. 10 h est déjà en heure d'été.
    expect(parisDateTime("2026-03-29", "10:00").toISOString()).toBe("2026-03-29T08:00:00.000Z");
    // 2 h 30 n'existe pas ce jour-là : on glisse à 3 h 30 (heure d'été).
    expect(parisDateTime("2026-03-29", "02:30").toISOString()).toBe("2026-03-29T01:30:00.000Z");
    // 25 octobre 2026 : 3 h → 2 h. 10 h est en heure d'hiver.
    expect(parisDateTime("2026-10-25", "10:00").toISOString()).toBe("2026-10-25T09:00:00.000Z");
  });

  it("refuse un format non ISO", () => {
    expect(() => parisDateTime("13/10/2026", "14:00")).toThrow();
    expect(() => parisDateTime("2026-10-13", "14h")).toThrow();
  });
});

describe("parisDayKey", () => {
  it("donne le jour à Paris, même quand UTC est encore la veille", () => {
    expect(parisDayKey("2026-07-15T22:30:00Z")).toBe("2026-07-16");
    expect(parisDayKey(new Date("2026-01-15T22:30:00Z"))).toBe("2026-01-15");
  });
});

describe("formatage", () => {
  it("affiche l'heure et le jour de Paris", () => {
    expect(formatTime("2026-10-13T12:00:00Z")).toBe("14:00");
    expect(formatLongDay("2026-10-13T12:00:00Z")).toBe("mardi 13 octobre");
    expect(formatDayKey("2026-10-13")).toBe("mardi 13 octobre");
    expect(dayKeyParts("2026-10-01")).toEqual({ dayNumber: "1", shortMonth: "oct." });
  });
});

describe("jours calendaires", () => {
  it("ajoute des jours, en passant les fins de mois et le changement d'heure", () => {
    expect(addDaysToKey("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("donne le jour de la semaine ISO (1 = lundi, 7 = dimanche)", () => {
    expect(isoWeekday("2026-10-12")).toBe(1);
    expect(isoWeekday("2026-10-18")).toBe(7);
  });
});
