import { Link } from "react-router";
import { ButtonLink } from "@/components/Button";
import type { BookingReceipt } from "@/features/booking/data";
import { BOOKING_RULES } from "@/lib/bookingRules";
import { formatLongDay, formatTime } from "@/lib/dates";
import { BookingSummary } from "@/pages/booking/BookingSummary";
import { StepFrame } from "@/pages/booking/StepFrame";

type ConfirmationStepProps = {
  receipt: BookingReceipt;
  focusOnMount: boolean;
};

/** Réservation confirmée : récap avec l'adresse exacte et le lien personnel d'annulation. */
export function ConfirmationStep({ receipt, focusOnMount }: ConfirmationStepProps) {
  const cancelPath = `/annuler?token=${encodeURIComponent(receipt.cancelToken)}`;
  const cancelUrl = `${window.location.origin}${cancelPath}`;

  return (
    <StepFrame title="C'est réservé !" focusOnMount={focusOnMount}>
      <p role="status" className="text-lg">
        Ton rendez-vous est confirmé. Merci et à bientôt !
      </p>
      <BookingSummary
        rows={[
          ["Prestation", receipt.serviceName],
          ["Date", formatLongDay(receipt.startsAt)],
          ["Heure", `${formatTime(receipt.startsAt)} – ${formatTime(receipt.endsAt)}`],
          ["Lieu", receipt.locationLabel],
          ["Adresse", receipt.privateAddress],
          ["Paiement", "En liquide, sur place"],
        ]}
      />

      <section aria-labelledby="cancel-link-title" className="flex flex-col gap-3">
        <h3 id="cancel-link-title">Ton lien d'annulation</h3>
        <p>
          Garde ce lien précieusement (capture d'écran ou favori) : c'est le seul moyen d'annuler en
          ligne, jusqu'à {BOOKING_RULES.cancelNoticeHours} h avant le rendez-vous. Ne le partage
          pas.
        </p>
        <p className="border border-ink/15 bg-surface p-3 text-sm break-all select-all">
          {cancelUrl}
        </p>
        <p>
          <Link to={cancelPath} className="link inline-flex min-h-tap items-center">
            Ouvrir ma page d'annulation
          </Link>
        </p>
      </section>

      <p>
        <ButtonLink to="/" variant="secondary" className="w-full sm:w-auto">
          Retour à l'accueil
        </ButtonLink>
      </p>
    </StepFrame>
  );
}
