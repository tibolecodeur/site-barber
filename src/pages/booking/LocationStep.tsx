import type { SubmitEvent } from "react";
import { Choice } from "@/components/Choice";
import { ErrorMessage, LoadingMessage } from "@/components/StatusMessage";
import { getLocationLabels } from "@/features/booking/data";
import { useAsync } from "@/lib/useAsync";
import { StepActions, StepFrame } from "@/pages/booking/StepFrame";

type LocationStepProps = {
  /** Lieu choisi ; null = « Peu importe ». */
  location: string | null;
  focusOnMount: boolean;
  onChange: (location: string | null) => void;
  onBack: () => void;
  onNext: () => void;
};

/**
 * Étape 2 : lieu. Ce n'est qu'un FILTRE sur les créneaux : c'est le barber qui fixe le lieu
 * de chaque disponibilité (docs/SPEC.md). « Peu importe » est coché par défaut.
 */
export function LocationStep({
  location,
  focusOnMount,
  onChange,
  onBack,
  onNext,
}: LocationStepProps) {
  const labels = useAsync("location-labels", getLocationLabels);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onNext();
  }

  return (
    <StepFrame number={2} title="Où ?" focusOnMount={focusOnMount}>
      <p>Deux lieux possibles. L'adresse exacte s'affiche une fois ta réservation confirmée.</p>
      {labels.status === "loading" && <LoadingMessage>Chargement des lieux…</LoadingMessage>}
      {labels.status === "error" && (
        <ErrorMessage onRetry={labels.reload}>
          Impossible de charger les lieux. Vérifie ta connexion, puis réessaie.
        </ErrorMessage>
      )}
      {labels.status === "success" && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Lieu</legend>
            <Choice
              type="radio"
              name="location"
              value=""
              checked={location === null}
              onChange={() => onChange(null)}
            >
              <span className="font-semibold">Peu importe</span>
              <span className="text-sm text-muted">Tous les créneaux libres</span>
            </Choice>
            {labels.data.map((label) => (
              <Choice
                key={label}
                type="radio"
                name="location"
                value={label}
                checked={location === label}
                onChange={() => onChange(label)}
              >
                <span className="font-semibold">{label}</span>
              </Choice>
            ))}
          </fieldset>
          <StepActions onBack={onBack} submitLabel="Continuer" />
        </form>
      )}
    </StepFrame>
  );
}
