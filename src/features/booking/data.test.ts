import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BookingError,
  cancelBooking,
  createBooking,
  getAvailableSlots,
  getBooking,
  getLocationLabels,
  getServices,
  isUuid,
  type NewBooking,
} from "@/features/booking/data";
import { formatTime } from "@/lib/dates";
import { FAKE_CANCEL_TOKENS, resetFakeDb } from "@/lib/fakeDb";

/**
 * Horloge figée : mardi 13 octobre 2026, 8 h à Paris. Données de démonstration (fakeDb) :
 * aujourd'hui dispo 9 h–21 h « Chez lui », RDV à 9 h (trop tard), 11 h et 19 h ;
 * mardi 20 : dispo 14 h–18 h, RDV annulé à 15 h, RDV confirmé à 16 h.
 */
const NOW = new Date("2026-10-13T06:00:00Z");
const TODAY = "2026-10-13";
const NEXT_TUESDAY = "2026-10-20";

let cutId: string;

beforeEach(async () => {
  // Seul `Date` est simulé : les promesses et les timers restent réels.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  resetFakeDb(NOW);
  cutId = (await getServices())[0]!.id;
});

afterEach(() => {
  vi.useRealTimers();
});

function bookingInput(overrides: Partial<NewBooking> = {}): NewBooking {
  return {
    serviceId: cutId,
    startsAt: "2026-10-20T12:00:00.000Z", // mardi 20, 14 h à Paris
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

describe("getServices et getLocationLabels", () => {
  it("renvoie les prestations actives dans l'ordre, sans prix inventé", async () => {
    expect(await getServices()).toEqual([
      { id: expect.any(String), name: "Coupe", durationMin: 60, priceLabel: null },
      { id: expect.any(String), name: "Coupe + barbe", durationMin: 60, priceLabel: null },
    ]);
  });

  it("renvoie les libellés publics des lieux, jamais l'adresse", async () => {
    expect(await getLocationLabels()).toEqual(["Chez ses parents", "Chez lui"]);
  });
});

describe("getAvailableSlots", () => {
  it("découpe la dispo toutes les 60 min, sans les créneaux à moins de 2 h ni les RDV pris", async () => {
    const slots = await getAvailableSlots(cutId, TODAY);
    expect(slots.map((s) => formatTime(s.startsAt))).toEqual([
      "10:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "20:00",
    ]);
    expect(slots[0]).toEqual({
      startsAt: "2026-10-13T08:00:00.000Z",
      endsAt: "2026-10-13T09:00:00.000Z",
      locationLabel: "Chez lui",
    });
  });

  it("libère le créneau d'un RDV annulé", async () => {
    const slots = await getAvailableSlots(cutId, NEXT_TUESDAY);
    expect(slots.map((s) => formatTime(s.startsAt))).toEqual(["14:00", "15:00", "17:00"]);
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
      locationLabel: "Chez lui",
      privateAddress: expect.stringContaining("fictive"),
      cancelToken: expect.any(String),
    });
    expect(isUuid(receipt.cancelToken)).toBe(true);
    const slots = await getAvailableSlots(cutId, NEXT_TUESDAY);
    expect(slots.map((s) => formatTime(s.startsAt))).toEqual(["15:00", "17:00"]);

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
      createBooking(bookingInput({ startsAt: "2026-10-20T15:00:00.000Z", phone: "0639980002" })),
      "limit_reached",
    );
  });

  it("limite aussi par email, alias « +… » compris", async () => {
    await createBooking(bookingInput({ phone: "", email: "lucas.martin+rdv@example.com" }));
    await expectBookingError(
      createBooking(
        bookingInput({
          startsAt: "2026-10-20T15:00:00.000Z",
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
      locationLabel: "Chez ses parents",
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

  it("n'autorise plus l'annulation à moins de 2 h", async () => {
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

  it("refuse à moins de 2 h du RDV (too_late)", async () => {
    await expectBookingError(cancelBooking(FAKE_CANCEL_TOKENS.tooLate), "too_late");
  });

  it("renvoie false pour un lien inconnu ou mal formé", async () => {
    expect(await cancelBooking("00000000-0000-4000-8000-000000000000")).toBe(false);
    expect(await cancelBooking("pas-un-uuid")).toBe(false);
  });
});
