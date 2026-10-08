import { ButtonLink } from "@/components/Button";
import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@/components/StatusMessage";
import { getAdminBookings, type AdminBooking } from "@/features/admin/data";
import { addDaysToKey, formatDayKey, parisDateTime, parisDayKey } from "@/lib/dates";
import { useAsync, type AsyncResult } from "@/lib/useAsync";
import { AdminBookingCard } from "@/pages/admin/AdminBookingCard";

/** Nombre de jours affichés dans « À venir ». */
const UPCOMING_DAYS = 7;

/** Tableau de bord : RDV du jour, puis ceux des 7 prochains jours. */
export function AdminDashboardPage() {
  const today = parisDayKey(new Date());
  const startOfToday = parisDateTime(today, "00:00").toISOString();
  const startOfTomorrow = parisDateTime(addDaysToKey(today, 1), "00:00").toISOString();
  const endOfUpcoming = parisDateTime(
    addDaysToKey(today, UPCOMING_DAYS + 1),
    "00:00",
  ).toISOString();

  const todayBookings = useAsync(`today|${today}`, () =>
    getAdminBookings({ from: startOfToday, to: startOfTomorrow }),
  );
  const upcomingBookings = useAsync(`upcoming|${today}`, () =>
    getAdminBookings({ from: startOfTomorrow, to: endOfUpcoming }),
  );

  return (
    <>
      <PageMeta title="Tableau de bord" description="Rendez-vous du jour et à venir." />
      <Section variant="blush">
        <h1>Tableau de bord</h1>
        <p className="first-letter:uppercase">{formatDayKey(today)}</p>
        <p>
          <ButtonLink to="/admin/disponibilites" className="w-full sm:w-auto">
            Ajouter une disponibilité
          </ButtonLink>
        </p>
      </Section>
      <Section>
        <BookingList
          title="Aujourd'hui"
          state={todayBookings}
          empty="Aucun rendez-vous aujourd'hui."
        />
        <BookingList
          title={`Les ${UPCOMING_DAYS} prochains jours`}
          state={upcomingBookings}
          empty="Aucun rendez-vous dans les 7 prochains jours."
          showDay
        />
        <p>
          <ButtonLink to="/admin/rendez-vous" variant="secondary" className="w-full sm:w-auto">
            Tous les rendez-vous
          </ButtonLink>
        </p>
      </Section>
    </>
  );
}

type BookingListProps = {
  title: string;
  state: AsyncResult<AdminBooking[]>;
  empty: string;
  showDay?: boolean;
};

function BookingList({ title, state, empty, showDay = false }: BookingListProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-3xl">{title}</h2>
      {state.status === "loading" && <LoadingMessage>Chargement des rendez-vous…</LoadingMessage>}
      {state.status === "error" && (
        <ErrorMessage onRetry={state.reload}>Impossible de charger les rendez-vous.</ErrorMessage>
      )}
      {state.status === "success" &&
        (state.data.length === 0 ? (
          <EmptyMessage>
            <p>{empty}</p>
          </EmptyMessage>
        ) : (
          <ul className="flex flex-col gap-3">
            {state.data.map((booking) => (
              <AdminBookingCard key={booking.id} booking={booking} showDay={showDay} />
            ))}
          </ul>
        ))}
    </section>
  );
}
