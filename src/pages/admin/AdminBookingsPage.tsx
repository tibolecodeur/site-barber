import { useState } from "react";
import { Choice } from "@/components/Choice";
import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@/components/StatusMessage";
import { getAdminBookings, type AdminBooking } from "@/features/admin/data";
import { formatLongDay, parisDateTime, parisDayKey } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { AdminBookingCard } from "@/pages/admin/AdminBookingCard";

/** Regroupe les RDV par jour (heure de Paris), dans l'ordre. */
function groupByDay(bookings: AdminBooking[]): [string, AdminBooking[]][] {
  const groups = new Map<string, AdminBooking[]>();
  for (const booking of bookings) {
    const day = parisDayKey(booking.startsAt);
    groups.set(day, [...(groups.get(day) ?? []), booking]);
  }
  return [...groups.entries()];
}

/** Liste des RDV à venir (à partir d'aujourd'hui), regroupés par jour. */
export function AdminBookingsPage() {
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const startOfToday = parisDateTime(parisDayKey(new Date()), "00:00").toISOString();
  const bookings = useAsync(`bookings|${startOfToday}|${includeCancelled}`, () =>
    getAdminBookings({ from: startOfToday, includeCancelled }),
  );

  return (
    <>
      <PageMeta title="Rendez-vous" description="Liste des rendez-vous à venir." />
      <Section variant="blush">
        <h1>Rendez-vous</h1>
        <Choice
          type="checkbox"
          checked={includeCancelled}
          onChange={(e) => setIncludeCancelled(e.target.checked)}
        >
          Afficher aussi les rendez-vous annulés
        </Choice>
      </Section>
      <Section>
        {bookings.status === "loading" && (
          <LoadingMessage>Chargement des rendez-vous…</LoadingMessage>
        )}
        {bookings.status === "error" && (
          <ErrorMessage onRetry={bookings.reload}>
            Impossible de charger les rendez-vous.
          </ErrorMessage>
        )}
        {bookings.status === "success" && bookings.data.length === 0 && (
          <EmptyMessage>
            <p>Aucun rendez-vous à venir.</p>
          </EmptyMessage>
        )}
        {bookings.status === "success" &&
          groupByDay(bookings.data).map(([day, dayBookings]) => (
            <section key={day} className="flex flex-col gap-3">
              <h2 className="text-3xl first-letter:uppercase">
                {formatLongDay(dayBookings[0]!.startsAt)}
              </h2>
              <ul className="flex flex-col gap-3">
                {dayBookings.map((booking) => (
                  <AdminBookingCard key={booking.id} booking={booking} />
                ))}
              </ul>
            </section>
          ))}
      </Section>
    </>
  );
}
