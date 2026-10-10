import { useState, type SubmitEvent } from "react";
import { ErrorMessage } from "@/components/StatusMessage";
import {
  BookingError,
  createBooking,
  type AvailableSlot,
  type BookingErrorCode,
  type BookingReceipt,
} from "@/features/booking/data";
import type { ContactForm } from "@/features/booking/validation";
import { BOOKING_RULES } from "@/lib/bookingRules";
import { formatLongDay, formatTime } from "@/lib/dates";
import { BookingSummary } from "@/pages/booking/BookingSummary";
import { StepActions, StepFrame } from "@/pages/booking/StepFrame";

/** Erreurs qui obligent à choisir un autre créneau : on renvoie à l'étape 3. */
const SLOT_ERRORS: Partial<Record<BookingErrorCode, string>> = {
  slot_unavailable: "Ce créneau vient d'être réservé par quelqu'un d'autre. Choisis-en un autre.",
  too_soon: `Les réservations se font au plus tard ${BOOKING_RULES.minNoticeHours} h avant. Choisis un autre créneau.`,
  too_far: "Ce créneau est trop loin dans le temps. Choisis-en un autre.",
};

const OTHER_ERRORS: Partial<Record<BookingErrorCode, string>> = {
  limit_reached: `Tu as déjà ${BOOKING_RULES.maxFutureBookings} rendez-vous à venir avec ce téléphone ou cet email. Annule-en un avant d'en réserver un autre.`,
  invalid_input:
    "Certaines informations ne sont pas acceptées. Reviens à l'étape précédente pour les vérifier.",
};

const DEFAULT_ERROR =
  "La réservation n'a pas pu être envoyée. Vérifie ta connexion, puis réessaie.";

type SummaryStepProps = {
  serviceId: string;
  serviceName: string;
  slot: AvailableSlot;
  contact: ContactForm;
  website: string;
  focusOnMount: boolean;
  onBack: () => void;
  onSlotLost: (message: string) => void;
  onBooked: (receipt: BookingReceipt) => void;
};

/** Étape 5 : récapitulatif, puis envoi de la réservation. */
export function SummaryStep(props: SummaryStepProps) {
  const { slot, contact } = props;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // Garde-fou contre le double appui : un seul envoi à la fois.
    if (submitting) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const receipt = await createBooking({
        serviceId: props.serviceId,
        startsAt: slot.startsAt,
        locationId: slot.locationId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
        website: props.website,
      });
      props.onBooked(receipt);
    } catch (caught) {
      const code = caught instanceof BookingError ? caught.code : "unknown";
      const slotMessage = SLOT_ERRORS[code];
      if (slotMessage) {
        props.onSlotLost(slotMessage);
      } else {
        setError(OTHER_ERRORS[code] ?? DEFAULT_ERROR);
        setSubmitting(false);
      }
    }
  }

  return (
    <StepFrame number={4} title="Vérifie et confirme" focusOnMount={props.focusOnMount}>
      <BookingSummary
        rows={[
          ["Prestation", props.serviceName],
          ["Date", formatLongDay(slot.startsAt)],
          ["Heure", `${formatTime(slot.startsAt)} – ${formatTime(slot.endsAt)}`],
          ["Lieu", slot.locationLabel],
          ["Nom", `${contact.firstName.trim()} ${contact.lastName.trim()}`],
          ...(contact.phone.trim()
            ? [["Téléphone", contact.phone.trim()] as [string, string]]
            : []),
          ...(contact.email.trim() ? [["Email", contact.email.trim()] as [string, string]] : []),
        ]}
      />
      <p>
        Paiement en liquide, sur place. Tu pourras annuler en ligne jusqu'à{" "}
        {BOOKING_RULES.cancelNoticeHours} h avant le rendez-vous.
      </p>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <form onSubmit={handleSubmit}>
        <StepActions
          onBack={props.onBack}
          submitLabel={submitting ? "Réservation en cours…" : "Confirmer la réservation"}
          submitting={submitting}
        />
      </form>
    </StepFrame>
  );
}
