import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BookingError,
  cancelBooking,
  createBooking,
  getAvailableSlots,
  getBooking,
  getServices,
  isUuid,
  type NewBooking,
} from "@/features/booking/data";
import { formatTime } from "@/lib/dates";
import { FAKE_CANCEL_TOKENS, fakeDb, resetFakeDb } from "@/lib/fakeDb";
import { getSupabase, SupabaseConfigError } from "@/lib/supabase";
import { fakeSupabaseClient, SERVICE_ROWS, type FakeQueryResult } from "@/test/fakeSupabase";

// getServices lit la vraie table : le client est simulé, aucune requête ne part.
vi.mock("@/lib/supabase", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/supabase")>()),
  getSupabase: vi.fn(),
}));

/** Simule la réponse de Supabase ; renvoie la liste des appels faits sur le client. */
function mockSupabase(result: FakeQueryResult) {
  const fake = fakeSupabaseClient(result);
  vi.mocked(getSupabase).mockReturnValue(fake.client);
  return fake.calls;
}

/**
 * Horloge figée : mardi 13 octobre 2026, 8 h à Paris. Règles : grille de 70 min, au moins 48 h
 * à l'avance (donc rien avant jeudi 15, 8 h), annulation jusqu'à 24 h avant.
 * Données de démonstration (fakeDb) : aujourd'hui dispo 9 h–21 h « Saint-Christophe-du-Bois »,
 * RDV à 9 h (trop tard), 11 h et 19 h ; vendredi 16 : 17 h–20 h ; mardi 20 : dispo 14 h–18 h,
 * RDV annulé à 15 h 10, RDV confirmé à 16 h 20.
 */
const NOW = new Date("2026-10-13T06:00:00Z");
const TODAY = "2026-10-13";
const NEXT_TUESDAY = "2026-10-20";

let cutId: string;
/** Lieu « Saint-Christophe-du-Bois », lu sur les créneaux comme le ferait l'écran. */
let locationBId: string;

beforeEach(async () => {
  // Seul `Date` est simulé : les promesses et les timers restent réels.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  resetFakeDb(NOW);
  // Créneaux et réservation sont encore factices : on lit la prestation dans la fausse base.
  cutId = fakeDb().services[0]!.id;
  locationBId = (await getAvailableSlots(cutId, NEXT_TUESDAY))[0]!.locationId;
});

afterEach(() => {
  vi.useRealTimers();
});

function bookingInput(overrides: Partial<NewBooking> = {}): NewBooking {
  return {
    serviceId: cutId,
    startsAt: "2026-10-20T12:00:00.000Z", // mardi 20, 14 h à Paris
    locationId: locationBId,
    firstName: " Zoé ",
    lastName: "Durand",
    phone: "06 39 98 00 10",
    ...overrides,
  };
}

async function expectBookingError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(BookingError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe("getServices", () => {
  it("lit les prestations triées, avec les seules colonnes lisibles par anon, sans filtre active", async () => {
    const calls = mockSupabase({ data: SERVICE_ROWS, error: null });

    expect(await getServices()).toEqual([
      { id: SERVICE_ROWS[0]!.id, name: "Coupe", durationMin: 60, priceLabel: null },
      { id: SERVICE_ROWS[1]!.id, name: "Coupe + barbe", durationMin: 60, priceLabel: "20 €" },
    ]);
    expect(calls.map(({ method, args }) => [method, ...args])).toEqual([
      ["from", "services"],
      ["select", "id, name, duration_min, price_label"],
      ["order", "sort_order"],
      ["order", "name"],
      ["abortSignal", expect.any(AbortSignal)],
    ]);
  });

  it("renvoie une liste vide s'il n'y a aucune prestation", async () => {
    mockSupabase({ data: [], error: null });
    expect(await getServices()).toEqual([]);
  });

  it("rejette en cas d'erreur réseau ou de base", async () => {
    mockSupabase({ data: null, error: { message: "TypeError: Failed to fetch" } });
    await expect(getServices()).rejects.toThrow(/Lecture des prestations impossible/);
  });

  it("rejette sans planter si les variables Supabase manquent", async () => {
    vi.mocked(getSupabase).mockImplementation(() => {
      throw new SupabaseConfigError();
    });
    await expect(getServices()).rejects.toBeInstanceOf(SupabaseConfigError);
  });

  it("transmet les prestations lues à la fausse base des créneaux (pont provisoire)", async () => {
    mockSupabase({ data: SERVICE_ROWS, error: null });
    await getServices();
    await getServices(); // relu : mise à jour, pas de doublon
    const slots = await getAvailableSlots(SERVICE_ROWS[0]!.id, NEXT_TUESDAY);
    expect(slots.length).toBeGreaterThan(0);
    // Les prestations de démonstration restent : les faux RDV y font référence.
    expect(fakeDb().services.map((s) => s.id)).toEqual([
      cutId,
      expect.any(String),
      SERVICE_ROWS[0]!.id,
      SERVICE_ROWS[1]!.id,
    ]);
  });
});

describe("getAvailableSlots", () => {
  it("ne propose rien à moins de 48 h", async () => {
    expect(await getAvailableSlots(cutId, TODAY)).toEqual([]);
    expect(await getAvailableSlots(cutId, "2026-10-14")).toEqual([]); // mercredi 17 h–20 h
  });

  it("découpe la dispo toutes les 70 min depuis son début, créneaux entiers dans la dispo", async () => {
    // Vendredi 16, 17 h–20 h : 17:00, 18:10 ; 19:20 finirait à 20:20, hors dispo.
    const slots = await getAvailableSlots(cutId, "2026-10-16");
    expect(slots.map((s) => formatTime(s.startsAt))).toEqual(["17:00", "18:10"]);
    // Forme exacte : le lieu (id + libellé public) vient avec le créneau, jamais l'adresse.
    expect(slots[0]).toEqual({
      startsAt: "2026-10-16T15:00:00.000Z",
      endsAt: "2026-10-16T16:00:00.000Z",
      locationId: locationBId,
      locationLabel: "Saint-Christophe-du-Bois",
    });
  });

  it("propose un créneau à 48 h pile, plus à 47 h 59", async () => {
    vi.setSystemTime(new Date("2026-10-14T15:00:00Z")); // mercredi 14, 17 h à Paris
    expect(
      (await getAvailableSlots(cutId, "2026-10-16")).map((s) => formatTime(s.startsAt)),
    ).toEqual(["17:00", "18:10"]);
    vi.setSystemTime(new Date("2026-10-14T15:01:00Z"));
    expect(
      (await getAvailableSlots(cutId, "2026-10-16")).map((s) => formatTime(s.startsAt)),
    ).toEqual(["18:10"]);
  });

  it("donne à chaque créneau le lieu de sa dispo, plusieurs lieux le même jour", async () => {
    // Samedi 17 : 10 h–13 h « Angers » (10 h déjà pris ; 12:20 déborderait),
    // 14 h–18 h « Saint-Christophe-du-Bois ».
    const slots = await getAvailableSlots(cutId, "2026-10-17");
    expect(slots.map((s) => [formatTime(s.startsAt), s.locationLabel])).toEqual([
      ["11:10", "Angers"],
      ["14:00", "Saint-Christophe-du-Bois"],
      ["15:10", "Saint-Christophe-du-Bois"],
      ["16:20", "Saint-Christophe-du-Bois"],
    ]);
    const locationAId = slots[0]!.locationId;
    expect(locationAId).not.toBe(locationBId);
    expect(slots.filter((s) => s.locationId === locationAId)).toHaveLength(1);
    expect(JSON.stringify(slots)).not.toMatch(/fictive/);
  });

  it("libère le créneau d'un RDV annulé", async () => {
    const slots = await getAvailableSlots(cutId, NEXT_TUESDAY);
    expect(slots.map((s) => formatTime(s.startsAt))).toEqual(["14:00", "15:10"]);
  });

  it("renvoie une liste vide sans dispo, au-delà de l'horizon ou pour une prestation inconnue", async () => {
    expect(await getAvailableSlots(cutId, "2026-10-18")).toEqual([]); // dimanche
    expect(await getAvailableSlots(cutId, "2026-11-17")).toEqual([]);
    expect(await getAvailableSlots("inconnue", NEXT_TUESDAY)).toEqual([]);
  });
});

describe("createBooking", () => {
  it("crée le RDV, renvoie le récap avec l'adresse et un lien d'annulation, et prend le créneau", async () => {
    const receipt = await createBooking(bookingInput());

    expect(receipt).toEqual({
      startsAt: "2026-10-20T12:00:00.000Z",
      endsAt: "2026-10-20T13:00:00.000Z",
      serviceName: "Coupe",
      locationLabel: "Saint-Christophe-du-Bois",
      privateAddress: expect.stringContaining("fictive"),
      cancelToken: expect.any(String),
    });
    expect(isUuid(receipt.cancelToken)).toBe(true);
    const slots = await getAvailableSlots(cutId, NEXT_TUESDAY);
    expect(slots.map((s) => formatTime(s.startsAt))).toEqual(["15:10"]);

    const details = await getBooking(receipt.cancelToken);
    expect(details).toMatchObject({ status: "confirmed", firstName: "Zoé", canCancel: true });
  });

  it("refuse un créneau déjà pris ou hors de la grille", async () => {
    await createBooking(bookingInput());
    await expectBookingError(
      createBooking(bookingInput({ phone: "0639980011" })),
      "slot_unavailable",
    );
    await expectBookingError(
      createBooking(bookingInput({ startsAt: "2026-10-20T12:30:00.000Z" })),
      "slot_unavailable",
    );
  });

  it("refuse un lieu qui n'est pas celui du créneau (dispo changée de lieu entre-temps)", async () => {
    const locationAId = (await getAvailableSlots(cutId, "2026-10-17"))[0]!.locationId;
    await expectBookingError(
      createBooking(bookingInput({ locationId: locationAId })),
      "slot_unavailable",
    );
    await expectBookingError(
      createBooking(bookingInput({ locationId: "inconnu" })),
      "slot_unavailable",
    );
    // Le créneau reste libre : rien n'a été réservé.
    const slots = await getAvailableSlots(cutId, NEXT_TUESDAY);
    expect(slots.map((s) => formatTime(s.startsAt))).toEqual(["14:00", "15:10"]);
  });

  it("refuse un créneau trop proche ou trop lointain", async () => {
    await expectBookingError(
      createBooking(bookingInput({ startsAt: "2026-10-13T07:30:00.000Z" })),
      "too_soon",
    );
    await expectBookingError(
      createBooking(bookingInput({ startsAt: "2026-11-17T12:00:00.000Z" })),
      "too_far",
    );
  });

  it("refuse le honeypot rempli et les coordonnées invalides", async () => {
    await expectBookingError(
      createBooking(bookingInput({ website: "spam.example" })),
      "invalid_input",
    );
    await expectBookingError(
      createBooking(bookingInput({ phone: "", email: "" })),
      "invalid_input",
    );
    await expectBookingError(createBooking(bookingInput({ firstName: "<b>" })), "invalid_input");
    await expectBookingError(
      createBooking(bookingInput({ email: "pas-un-email" })),
      "invalid_input",
    );
    await expectBookingError(
      createBooking(bookingInput({ serviceId: "inconnue" })),
      "invalid_input",
    );
  });

  it("limite à 2 RDV futurs par téléphone, quelle que soit son écriture", async () => {
    // Le 06 39 98 00 02 a déjà un RDV (Lucas, samedi).
    await createBooking(bookingInput({ phone: "+33 6 39 98 00 02" }));
    await expectBookingError(
      createBooking(bookingInput({ startsAt: "2026-10-20T13:10:00.000Z", phone: "0639980002" })),
      "limit_reached",
    );
  });

  it("limite aussi par email, alias « +… » compris", async () => {
    await createBooking(bookingInput({ phone: "", email: "lucas.martin+rdv@example.com" }));
    await expectBookingError(
      createBooking(
        bookingInput({
          startsAt: "2026-10-20T13:10:00.000Z", // mardi 15 h 10
          phone: "",
          email: "LUCAS.MARTIN@example.com",
        }),
      ),
      "limit_reached",
    );
  });
});

describe("getBooking", () => {
  it("donne le détail d'un RDV annulable, avec l'adresse", async () => {
    expect(await getBooking(FAKE_CANCEL_TOKENS.valid)).toEqual({
      status: "confirmed",
      startsAt: "2026-10-17T08:00:00.000Z",
      endsAt: "2026-10-17T09:00:00.000Z",
      serviceName: "Coupe + barbe",
      locationLabel: "Angers",
      privateAddress: expect.stringContaining("fictive"),
      firstName: "Lucas",
      canCancel: true,
    });
  });

  it("ne révèle plus l'adresse d'un RDV annulé", async () => {
    expect(await getBooking(FAKE_CANCEL_TOKENS.cancelled)).toMatchObject({
      status: "cancelled",
      privateAddress: null,
      canCancel: false,
    });
  });

  it("n'autorise plus l'annulation à moins de 24 h", async () => {
    expect(await getBooking(FAKE_CANCEL_TOKENS.tooLate)).toMatchObject({
      status: "confirmed",
      canCancel: false,
    });
  });

  it("renvoie null pour un lien inconnu ou mal formé", async () => {
    expect(await getBooking("00000000-0000-4000-8000-000000000000")).toBeNull();
    expect(await getBooking("pas-un-uuid")).toBeNull();
    expect(await getBooking("")).toBeNull();
  });
});

describe("cancelBooking", () => {
  it("annule une fois, puis renvoie false", async () => {
    expect(await cancelBooking(FAKE_CANCEL_TOKENS.valid)).toBe(true);
    expect(await getBooking(FAKE_CANCEL_TOKENS.valid)).toMatchObject({ status: "cancelled" });
    expect(await cancelBooking(FAKE_CANCEL_TOKENS.valid)).toBe(false);
  });

  it("refuse à moins de 24 h du RDV (too_late)", async () => {
    await expectBookingError(cancelBooking(FAKE_CANCEL_TOKENS.tooLate), "too_late");
  });

  it("renvoie false pour un lien inconnu ou mal formé", async () => {
    expect(await cancelBooking("00000000-0000-4000-8000-000000000000")).toBe(false);
    expect(await cancelBooking("pas-un-uuid")).toBe(false);
  });
});
