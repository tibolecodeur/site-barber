import { BOOKING_RULES, HOUR_MS } from "@/lib/bookingRules";
import { addDaysToKey, formatTime, parisDateTime, parisDayKey, type DayKey } from "@/lib/dates";
import { fakeDb, fakeLatency, overlapsRange, type BookingRow } from "@/lib/fakeDb";
import { randomUuid } from "@/lib/uuid";
import {
  isValidEmail,
  isValidName,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
} from "@/features/booking/validation";

/**
 * Couche données de la réservation : les écrans n'importent QUE ces fonctions.
 * Chaque fonction a la forme de la table ou de la RPC Supabase correspondante
 * (supabase/migrations/…_fonctions_rpc.sql), avec des noms en camelCase.
 *
 * TODO: brancher Supabase. Implémentation factice (src/lib/fakeDb.ts) : remplacer chaque
 * corps par l'appel `supabase.from(…)` ou `supabase.rpc(…)`, puis convertir la ligne reçue.
 */

/** Table `services`. */
export type Service = {
  id: string;
  name: string;
  durationMin: number;
  /** Prix affiché tel quel (« 15 € ») ; null tant qu'il n'est pas fixé. */
  priceLabel: string | null;
};

/**
 * Ligne renvoyée par la RPC `get_available_slots` : chaque créneau porte son lieu, fixé par le
 * barber dans sa disponibilité. Le client choisit un créneau, jamais un lieu.
 * Libellé public uniquement : l'adresse privée n'est jamais renvoyée ici.
 */
export type AvailableSlot = {
  startsAt: string;
  endsAt: string;
  locationId: string;
  locationLabel: string;
};

/** Paramètres de la RPC `create_booking`. */
export type NewBooking = {
  serviceId: string;
  startsAt: string;
  /** Lieu du créneau choisi : la base vérifie qu'il correspond toujours à la disponibilité. */
  locationId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  /** Honeypot : champ invisible, rempli seulement par les robots. */
  website?: string;
};

/** Ligne renvoyée par la RPC `create_booking` : le récapitulatif, avec l'adresse privée. */
export type BookingReceipt = {
  startsAt: string;
  endsAt: string;
  serviceName: string;
  locationLabel: string;
  privateAddress: string;
  cancelToken: string;
};

/** Ligne renvoyée par la RPC `get_booking`. */
export type BookingDetails = {
  status: "confirmed" | "cancelled";
  startsAt: string;
  endsAt: string;
  serviceName: string;
  locationLabel: string;
  /** Révélée seulement pour un RDV confirmé et pas encore terminé. */
  privateAddress: string | null;
  firstName: string;
  canCancel: boolean;
};

/** Clés d'erreur stables renvoyées par les RPC (exceptions P0001), plus « unknown » (réseau…). */
export type BookingErrorCode =
  | "invalid_input"
  | "slot_unavailable"
  | "too_soon"
  | "too_far"
  | "limit_reached"
  | "too_late"
  | "unknown";

export class BookingError extends Error {
  readonly code: BookingErrorCode;

  constructor(code: BookingErrorCode) {
    super(code);
    this.name = "BookingError";
    this.code = code;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Vrai si la chaîne a la forme d'un uuid. À vérifier AVANT d'appeler la base : Postgres
 * répondrait par une erreur de syntaxe, qu'on afficherait à tort comme une panne.
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Prestations actives, dans l'ordre d'affichage. */
export async function getServices(): Promise<Service[]> {
  await fakeLatency();
  return fakeDb()
    .services.filter((s) => s.active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.duration_min,
      priceLabel: s.price_label,
    }));
}

/**
 * Copie de `private.max_booking_time` : maintenant + 4 semaines, à la même heure d'horloge à
 * Paris (même si un changement d'heure tombe entre les deux).
 */
function maxBookingTime(now: Date): number {
  const day = addDaysToKey(parisDayKey(now), BOOKING_RULES.maxAdvanceDays);
  return parisDateTime(day, formatTime(now)).getTime();
}

/**
 * Copie de `private.compute_slots` : grille au pas de 60 min depuis le DÉBUT de chaque
 * dispo, créneaux entiers dans la dispo, moins les RDV confirmés (tous lieux), moins ce qui
 * est à moins de 2 h ou au-delà de 4 semaines.
 */
function computeSlots(serviceId: string, day: DayKey, now: Date) {
  const db = fakeDb();
  const service = db.services.find((s) => s.id === serviceId && s.active);
  if (!service) return [];

  const durationMs = service.duration_min * 60_000;
  const stepMs = BOOKING_RULES.slotStepMinutes * 60_000;
  const dayStart = parisDateTime(day, "00:00").getTime();
  const dayEnd = parisDateTime(addDaysToKey(day, 1), "00:00").getTime();
  const earliest = now.getTime() + BOOKING_RULES.minNoticeHours * HOUR_MS;
  const latest = maxBookingTime(now);

  const slots: AvailableSlot[] = [];
  for (const availability of db.availabilities) {
    const location = db.locations.find((l) => l.id === availability.location_id && l.active);
    if (!location) continue;
    const availabilityEnd = Date.parse(availability.ends_at);
    for (
      let start = Date.parse(availability.starts_at);
      start + durationMs <= availabilityEnd;
      start += stepMs
    ) {
      if (start < dayStart || start >= dayEnd || start < earliest || start > latest) continue;
      const startsAt = new Date(start).toISOString();
      const endsAt = new Date(start + durationMs).toISOString();
      const taken = db.bookings.some(
        (b) => b.status === "confirmed" && overlapsRange(b.starts_at, b.ends_at, startsAt, endsAt),
      );
      if (!taken) {
        slots.push({
          startsAt,
          endsAt,
          locationId: location.id,
          locationLabel: location.public_label,
        });
      }
    }
  }
  return slots.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

/** RPC `get_available_slots(p_service_id, p_day)` : créneaux libres d'un jour (heure de Paris). */
export async function getAvailableSlots(serviceId: string, day: DayKey): Promise<AvailableSlot[]> {
  await fakeLatency();
  return computeSlots(serviceId, day, new Date());
}

/** RPC `create_booking` : crée le RDV et renvoie le récap (dont l'adresse et le lien d'annulation). */
export async function createBooking(input: NewBooking): Promise<BookingReceipt> {
  await fakeLatency();
  const db = fakeDb();
  const now = new Date();

  if ((input.website ?? "").trim() !== "") throw new BookingError("invalid_input");
  const phone = normalizePhone(input.phone ?? "");
  const email = normalizeEmail(input.email ?? "");
  const service = db.services.find((s) => s.id === input.serviceId && s.active);
  if (
    !service ||
    !isValidName(input.firstName) ||
    !isValidName(input.lastName) ||
    (phone === null && email === null) ||
    (phone !== null && !isValidPhone(phone)) ||
    (email !== null && !isValidEmail(email))
  ) {
    throw new BookingError("invalid_input");
  }

  const startsAtMs = Date.parse(input.startsAt);
  if (startsAtMs < now.getTime() + BOOKING_RULES.minNoticeHours * HOUR_MS) {
    throw new BookingError("too_soon");
  }
  if (startsAtMs > maxBookingTime(now)) {
    throw new BookingError("too_far");
  }

  // Le créneau doit exister, libre, ET dans le lieu affiché au client : si le barber a changé
  // le lieu de la dispo entre-temps, le client ne réserve pas un lieu qu'il n'a pas vu.
  const slot = computeSlots(service.id, parisDayKey(input.startsAt), now).find(
    (s) => Date.parse(s.startsAt) === startsAtMs && s.locationId === input.locationId,
  );
  if (!slot) throw new BookingError("slot_unavailable");

  // Anti-abus : au plus N RDV futurs par téléphone ou par email (alias « +… » ignoré).
  const withoutAlias = (value: string) => value.replace(/\+[^@]*@/, "@");
  const futureForContact = db.bookings.filter(
    (b) =>
      b.status === "confirmed" &&
      Date.parse(b.starts_at) > now.getTime() &&
      ((phone !== null && b.phone === phone) ||
        (email !== null && b.email !== null && withoutAlias(b.email) === withoutAlias(email))),
  );
  if (futureForContact.length >= BOOKING_RULES.maxFutureBookings) {
    throw new BookingError("limit_reached");
  }

  const location = db.locations.find((l) => l.id === slot.locationId)!;
  const booking: BookingRow = {
    id: randomUuid(),
    service_id: service.id,
    location_id: location.id,
    starts_at: slot.startsAt,
    ends_at: slot.endsAt,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    phone,
    email,
    status: "confirmed",
    cancel_token: randomUuid(),
    created_at: now.toISOString(),
  };
  db.bookings.push(booking);

  return {
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    serviceName: service.name,
    locationLabel: location.public_label,
    privateAddress: location.private_address,
    cancelToken: booking.cancel_token,
  };
}

/** RPC `get_booking(p_token)` : null si le lien est invalide (rien d'autre ne fuit). */
export async function getBooking(token: string): Promise<BookingDetails | null> {
  if (!isUuid(token)) return null;
  await fakeLatency();
  const db = fakeDb();
  const booking = db.bookings.find((b) => b.cancel_token === token.toLowerCase());
  if (!booking) return null;

  const now = Date.now();
  const service = db.services.find((s) => s.id === booking.service_id)!;
  const location = db.locations.find((l) => l.id === booking.location_id)!;
  const isConfirmed = booking.status === "confirmed";
  return {
    status: booking.status,
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    serviceName: service.name,
    locationLabel: location.public_label,
    privateAddress:
      isConfirmed && Date.parse(booking.ends_at) > now ? location.private_address : null,
    firstName: booking.first_name,
    canCancel:
      isConfirmed &&
      now <= Date.parse(booking.starts_at) - BOOKING_RULES.cancelNoticeHours * HOUR_MS,
  };
}

/**
 * RPC `cancel_booking(p_token)` : true si annulé ; false si lien inconnu ou RDV déjà annulé ;
 * erreur `too_late` à moins de 2 h du RDV.
 */
export async function cancelBooking(token: string): Promise<boolean> {
  if (!isUuid(token)) return false;
  await fakeLatency();
  const booking = fakeDb().bookings.find((b) => b.cancel_token === token.toLowerCase());
  if (!booking || booking.status !== "confirmed") return false;
  if (Date.now() > Date.parse(booking.starts_at) - BOOKING_RULES.cancelNoticeHours * HOUR_MS) {
    throw new BookingError("too_late");
  }
  booking.status = "cancelled";
  return true;
}
