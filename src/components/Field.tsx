import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type FieldProps = Omit<ComponentProps<"input">, "id" | "className"> & {
  id: string;
  /** Libellé toujours visible (jamais remplacé par un placeholder). */
  label: string;
  /** Aide affichée sous le champ. */
  hint?: string;
  /** Message d'erreur : marque le champ invalide et est lu par les lecteurs d'écran. */
  error?: string;
  /** Identifiant(s) d'une aide extérieure au champ, partagée entre plusieurs champs. */
  describedBy?: string;
};

/**
 * Champ de saisie avec libellé, aide et erreur, à utiliser sur fond clair uniquement
 * (le gris secondaire est interdit sur bloc noir).
 *
 * `aria-describedby` relie le champ à son aide et à son erreur : le lecteur d'écran les lit
 * en arrivant sur le champ. Les `id` sont dérivés de celui du champ, donc uniques.
 */
export function Field({ id, label, hint, error, describedBy, ...inputProps }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const ariaDescribedBy = cx(describedBy, hintId, errorId) || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={ariaDescribedBy}
        className={cx(
          // 16 px minimum (zoom Safari) et 44 px de haut. Bordure grise : 6,69 sur blanc.
          "block min-h-tap w-full border bg-surface px-3 py-2 text-base text-ink",
          // Safari iOS centre la date affichée dans un champ date : on la ramène à gauche.
          "[&::-webkit-date-and-time-value]:text-left",
          error ? "border-2 border-accent" : "border-muted",
        )}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        // Rose foncé en gras : 5,87 sur blanc, 4,56 sur rose pâle (le gras est alors requis).
        <p id={errorId} className="text-sm font-bold text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
