import { Card } from "@/components/Card";
import type { AdminBooking } from "@/features/admin/data";
import { formatLongDay, formatTime } from "@/lib/dates";

/** « 0612345678 » → « 06 12 34 56 78 » ; les numéros internationaux restent tels quels. */
function formatPhone(phone: string): string {
  return /^0\d{9}$/.test(phone) ? phone.replace(/(\d{2})(?=\d)/g, "$1 ") : phone;
}

const CONTACT_LINK_CLASS = "link inline-flex min-h-tap items-center break-all";

/** Un rendez-vous côté admin : heure, prestation, client et liens pour le joindre. */
export function AdminBookingCard({
  booking,
  showDay = false,
}: {
  booking: AdminBooking;
  showDay?: boolean;
}) {
  const cancelled = booking.status === "cancelled";
  return (
    <Card as="li">
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span className={cancelled ? "text-xl font-bold line-through" : "text-xl font-bold"}>
          {showDay && `${formatLongDay(booking.startsAt)}, `}
          {formatTime(booking.startsAt)} – {formatTime(booking.endsAt)}
        </span>
        {/* Statut écrit en toutes lettres : jamais signalé par la seule couleur. */}
        {cancelled && <span className="border border-ink px-2 text-sm font-semibold">Annulé</span>}
      </p>
      <p className="font-semibold">
        {booking.firstName} {booking.lastName}
      </p>
      <p className="text-muted">
        {booking.serviceName} · {booking.locationLabel}
      </p>
      <p className="flex flex-col">
        {booking.phone && (
          <a href={`tel:${booking.phone}`} className={CONTACT_LINK_CLASS}>
            Appeler le {formatPhone(booking.phone)}
          </a>
        )}
        {booking.email && (
          <a href={`mailto:${booking.email}`} className={CONTACT_LINK_CLASS}>
            {booking.email}
          </a>
        )}
      </p>
    </Card>
  );
}
