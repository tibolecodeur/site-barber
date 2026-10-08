import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Choice } from "@/components/Choice";
import { Field } from "@/components/Field";
import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
  SuccessMessage,
} from "@/components/StatusMessage";
import {
  AdminError,
  createAvailability,
  deleteAvailability,
  getAvailabilities,
  getLocations,
  type Availability,
} from "@/features/admin/data";
import { formatLongDay, formatTime, parisDateTime, parisDayKey } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { GroupError } from "@/pages/booking/StepFrame";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_range: "L'heure de fin doit être après l'heure de début (24 h maximum).",
  availability_overlap:
    "Cette plage chevauche une autre disponibilité (tous lieux confondus). Modifie les horaires.",
  availability_has_bookings:
    "Des rendez-vous sont prévus sur cette plage : annule-les d'abord, puis supprime-la.",
  not_found: "Cette disponibilité n'existe plus. Recharge la page.",
};

function errorMessage(caught: unknown): string {
  return (
    (caught instanceof AdminError && ERROR_MESSAGES[caught.code]) ||
    "L'action n'a pas pu être enregistrée. Vérifie ta connexion, puis réessaie."
  );
}

/** Disponibilités : ajout d'une plage (jour, heures, lieu) et suppression. */
export function AdminAvailabilitiesPage() {
  const availabilities = useAsync("availabilities", getAvailabilities);

  return (
    <>
      <PageMeta title="Disponibilités" description="Gestion des disponibilités publiées." />
      <Section variant="blush">
        <h1>Disponibilités</h1>
        <p>Les clients ne peuvent réserver que dans ces plages, par créneaux d'une heure.</p>
      </Section>
      <Section>
        <AddAvailabilityForm onAdded={availabilities.reload} />
      </Section>
      <Section variant="blush">
        <h2>À venir</h2>
        {availabilities.status === "loading" && (
          <LoadingMessage>Chargement des disponibilités…</LoadingMessage>
        )}
        {availabilities.status === "error" && (
          <ErrorMessage onRetry={availabilities.reload}>
            Impossible de charger les disponibilités.
          </ErrorMessage>
        )}
        {availabilities.status === "success" &&
          (availabilities.data.length === 0 ? (
            <EmptyMessage>
              <p>Aucune disponibilité à venir : les clients ne peuvent pas réserver.</p>
            </EmptyMessage>
          ) : (
            <ul className="flex flex-col gap-3">
              {availabilities.data.map((availability) => (
                <AvailabilityItem
                  key={availability.id}
                  availability={availability}
                  onDeleted={availabilities.reload}
                />
              ))}
            </ul>
          ))}
      </Section>
    </>
  );
}

function AddAvailabilityForm({ onAdded }: { onAdded: () => void }) {
  const locations = useAsync("locations", getLocations);
  const today = parisDayKey(new Date());
  const [day, setDay] = useState(today);
  const [from, setFrom] = useState("14:00");
  const [to, setTo] = useState("18:00");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [locationError, setLocationError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    if (locationId === null) {
      setLocationError("Choisis un lieu.");
      return;
    }
    if (day === "" || from === "" || to === "") {
      setError("Indique le jour, l'heure de début et l'heure de fin.");
      return;
    }
    if (to <= from) {
      setError(ERROR_MESSAGES.invalid_range);
      return;
    }
    if (parisDateTime(day, from).getTime() < Date.now()) {
      setError("Cette plage commence dans le passé : choisis un jour et une heure à venir.");
      return;
    }
    setSubmitting(true);
    try {
      // Les heures saisies sont des heures de Paris, converties en instants absolus.
      const created = await createAvailability({
        locationId,
        startsAt: parisDateTime(day, from).toISOString(),
        endsAt: parisDateTime(day, to).toISOString(),
      });
      setSuccess(
        `Disponibilité ajoutée : ${formatLongDay(created.startsAt)}, ${formatTime(created.startsAt)} – ${formatTime(created.endsAt)}, ${created.locationLabel}.`,
      );
      onAdded();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="add-availability"
      className="flex flex-col gap-5"
    >
      <h2 id="add-availability">Ajouter une plage</h2>
      <Field
        id="availability-day"
        name="day"
        type="date"
        label="Jour"
        min={today}
        value={day}
        onChange={(e) => setDay(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          id="availability-from"
          name="from"
          type="time"
          step={900}
          label="Début"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Field
          id="availability-to"
          name="to"
          type="time"
          step={900}
          label="Fin"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <fieldset
        className="flex flex-col gap-3"
        aria-describedby={locationError ? "availability-location-error" : undefined}
      >
        <legend className="mb-2 font-semibold">Lieu</legend>
        {locations.status === "loading" && <LoadingMessage>Chargement des lieux…</LoadingMessage>}
        {locations.status === "error" && (
          <ErrorMessage onRetry={locations.reload}>Impossible de charger les lieux.</ErrorMessage>
        )}
        {locations.status === "success" &&
          locations.data.map((location) => (
            <Choice
              key={location.id}
              type="radio"
              name="location"
              value={location.id}
              checked={locationId === location.id}
              onChange={() => {
                setLocationId(location.id);
                setLocationError(undefined);
              }}
            >
              <span className="font-semibold">{location.publicLabel}</span>
              <span className="text-sm text-muted">{location.privateAddress}</span>
            </Choice>
          ))}
        <GroupError id="availability-location-error" message={locationError} />
      </fieldset>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      <Button
        type="submit"
        disabled={submitting}
        aria-busy={submitting || undefined}
        className="w-full sm:w-auto"
      >
        {submitting ? "Ajout en cours…" : "Ajouter la disponibilité"}
      </Button>
    </form>
  );
}

function AvailabilityItem({
  availability,
  onDeleted,
}: {
  availability: Availability;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const label = `${formatLongDay(availability.startsAt)}, ${formatTime(availability.startsAt)} – ${formatTime(availability.endsAt)}`;

  async function handleDelete() {
    setDeleting(true);
    setError(undefined);
    try {
      await deleteAvailability(availability.id);
      onDeleted();
    } catch (caught) {
      setError(errorMessage(caught));
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <Card as="li">
      <p className="text-lg font-bold first-letter:uppercase">{label}</p>
      <p className="text-muted">{availability.locationLabel}</p>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {/* Suppression en deux temps : pas de suppression par un appui malheureux. */}
      {confirming ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => setConfirming(false)} disabled={deleting}>
            Garder
          </Button>
          <Button onClick={handleDelete} disabled={deleting} aria-busy={deleting || undefined}>
            {deleting ? "Suppression…" : "Oui, supprimer"}
          </Button>
        </div>
      ) : (
        <p>
          <Button
            variant="secondary"
            onClick={() => setConfirming(true)}
            aria-label={`Supprimer la disponibilité du ${label}`}
          >
            Supprimer
          </Button>
        </p>
      )}
    </Card>
  );
}
