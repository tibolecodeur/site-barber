import { addDays, format, getISODay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Dates du site. Règle du projet : tout est stocké en instants absolus (timestamptz, chaînes
 * ISO) et affiché en heure de Paris, QUEL QUE SOIT le fuseau du téléphone du visiteur.
 *
 * Deux sortes de valeurs :
 * - un instant (`Date` ou chaîne ISO « 2026-10-13T12:00:00Z ») : affiché via `Intl` avec
 *   `timeZone: "Europe/Paris"` (natif, aucune dépendance) ;
 * - un jour calendaire (`DayKey`, « 2026-10-13 ») : sans fuseau, manipulé avec date-fns.
 * Jamais de `new Date("13/10/2026")` : Safari refuse les formats non ISO.
 */
export const PARIS_TIME_ZONE = "Europe/Paris";

/** Jour calendaire au format ISO « yyyy-MM-dd ». */
export type DayKey = string;

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

// Formateurs créés une seule fois : leur construction est coûteuse.
const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: PARIS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PARIS_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const longDayFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PARIS_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

function toDate(value: Date | string): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** Année, mois, jour, heure… de cet instant, lus sur une horloge de Paris. */
function parisParts(date: Date) {
  const parts: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
}

/** Décalage de Paris sur UTC à cet instant, en minutes : 60 l'hiver, 120 l'été. */
function parisOffsetMinutes(date: Date): number {
  const p = parisParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - date.getTime()) / 60_000);
}

/** Jour (à Paris) de cet instant : à 23 h 30 UTC en été, on est déjà le lendemain à Paris. */
export function parisDayKey(value: Date | string): DayKey {
  const p = parisParts(toDate(value));
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * Instant correspondant à « tel jour, telle heure, à Paris ».
 * On part de l'heure lue comme si c'était de l'UTC, puis on retire le décalage de Paris ; le
 * décalage est recalculé une seconde fois, car il peut changer entre les deux (changement
 * d'heure). Une heure qui n'existe pas (2 h 30 le jour du passage à l'heure d'été) glisse
 * d'une heure plus tard.
 */
export function parisDateTime(day: DayKey, time: string): Date {
  const d = DAY_KEY_PATTERN.exec(day);
  const t = TIME_PATTERN.exec(time);
  if (!d || !t) throw new Error(`Date ou heure invalide : ${day} ${time}`);
  const naiveUtc = Date.UTC(
    Number(d[1]),
    Number(d[2]) - 1,
    Number(d[3]),
    Number(t[1]),
    Number(t[2]),
  );
  const firstGuess = naiveUtc - parisOffsetMinutes(new Date(naiveUtc)) * 60_000;
  return new Date(naiveUtc - parisOffsetMinutes(new Date(firstGuess)) * 60_000);
}

/** « 14:00 » (heure de Paris). */
export function formatTime(value: Date | string): string {
  return timeFormatter.format(toDate(value));
}

/** « mardi 13 octobre » (jour à Paris de cet instant). */
export function formatLongDay(value: Date | string): string {
  return longDayFormatter.format(toDate(value));
}

/** « mardi 13 octobre » pour un jour calendaire. */
export function formatDayKey(day: DayKey): string {
  return format(parseISO(day), "EEEE d MMMM", { locale: fr });
}

/** « 13 » et « oct. » : numéro du jour et mois abrégé, pour le calendrier. */
export function dayKeyParts(day: DayKey): { dayNumber: string; shortMonth: string } {
  const date = parseISO(day);
  return { dayNumber: format(date, "d"), shortMonth: format(date, "MMM", { locale: fr }) };
}

/** Jour calendaire décalé de `amount` jours (négatif pour reculer). */
export function addDaysToKey(day: DayKey, amount: number): DayKey {
  return format(addDays(parseISO(day), amount), "yyyy-MM-dd");
}

/** Jour de la semaine ISO : 1 = lundi … 7 = dimanche. */
export function isoWeekday(day: DayKey): number {
  return getISODay(parseISO(day));
}
