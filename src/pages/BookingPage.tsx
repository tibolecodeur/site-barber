import type { SubmitEvent } from "react";
import { Link } from "react-router";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";
import { PROVISIONAL_SERVICES } from "@/features/booking/provisionalServices";

const STEP_CLASS = "flex flex-col gap-3";
const STEP_TITLE_CLASS = "mb-3 text-3xl";
/**
 * Choix (radio, case à cocher) : tout le libellé est cliquable et fait au moins 44 px.
 * `has-checked:` (sélecteur CSS :has) met en évidence l'option cochée, sans JavaScript.
 */
const CHOICE_CLASS =
  "flex min-h-tap items-center gap-3 border border-ink/20 bg-surface px-4 py-3 has-checked:border-ink has-checked:bg-blush";
const CONTROL_CLASS = "size-5 shrink-0 accent-ink";

/**
 * Squelette du parcours de réservation : structure et libellés seulement.
 * Aucune validation, aucun envoi : le branchement à la base viendra en phase 5.
 *
 * Chaque étape porte un titre h2 (plan de la page pour les lecteurs d'écran). Les étapes qui
 * regroupent plusieurs champs sont des <fieldset> dont le <legend> contient ce h2 : le groupe
 * est ainsi nommé ET présent dans le plan des titres. Les autres sont des <section>.
 */
export function BookingPage() {
  // Sans ça, le navigateur « enverrait » le formulaire en rechargeant la page avec les
  // valeurs dans l'URL (méthode GET par défaut). On bloque ce comportement natif.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <>
      <PageMeta
        title="Réserver"
        description="Réservez un créneau chez CutsByAlix : choisissez une prestation, un jour et un créneau libre. Paiement sur place."
      />
      <Section variant="blush">
        <h1>Réserver</h1>
      </Section>

      <Section>
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <fieldset className={STEP_CLASS}>
            <legend>
              <h2 className={STEP_TITLE_CLASS}>1. Prestation</h2>
            </legend>
            {PROVISIONAL_SERVICES.map((service) => (
              <label key={service.id} className={CHOICE_CLASS}>
                <input type="radio" name="service" value={service.id} className={CONTROL_CLASS} />
                {service.name} ({service.durationMin} min, prix : {service.priceLabel})
              </label>
            ))}
          </fieldset>

          <section aria-labelledby="booking-step-day" className={STEP_CLASS}>
            <h2 id="booking-step-day" className={STEP_TITLE_CLASS}>
              2. Jour
            </h2>
            <Field id="booking-day" name="day" type="date" label="Jour du rendez-vous" />
          </section>

          <section aria-labelledby="booking-step-slot" className={STEP_CLASS}>
            <h2 id="booking-step-slot" className={STEP_TITLE_CLASS}>
              3. Créneau
            </h2>
            <p className="text-muted">Les créneaux libres du jour choisi s'afficheront ici.</p>
          </section>

          <fieldset className="flex flex-col gap-5">
            <legend>
              <h2 className={STEP_TITLE_CLASS}>4. Vos coordonnées</h2>
            </legend>
            <Field
              id="booking-first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              label="Prénom"
            />
            <Field
              id="booking-last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              label="Nom"
            />
            {/* Consigne lue par les lecteurs d'écran à l'arrivée sur chacun des deux champs. */}
            <p id="booking-contact-hint" className="text-muted">
              Téléphone et/ou email : au moins l'un des deux.
            </p>
            <Field
              id="booking-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              label="Téléphone"
              describedBy="booking-contact-hint"
            />
            <Field
              id="booking-email"
              name="email"
              type="email"
              autoComplete="email"
              label="Email"
              describedBy="booking-contact-hint"
            />
          </fieldset>

          <section aria-labelledby="booking-step-consent" className={STEP_CLASS}>
            <h2 id="booking-step-consent" className={STEP_TITLE_CLASS}>
              5. Consentement
            </h2>
            <label className={CHOICE_CLASS}>
              <input type="checkbox" name="consent" className={CONTROL_CLASS} />
              J'accepte que ces informations servent uniquement à gérer mon rendez-vous.
            </label>
            <p>
              <Link
                to="/politique-confidentialite"
                className="link inline-flex min-h-tap items-center"
              >
                Lire la politique de confidentialité
              </Link>
            </p>
          </section>

          <section aria-labelledby="booking-step-confirmation" className={STEP_CLASS}>
            <h2 id="booking-step-confirmation" className={STEP_TITLE_CLASS}>
              6. Confirmation
            </h2>
            <p>Paiement en liquide, sur place. Le lieu exact s'affichera après la réservation.</p>
            <p>
              <Button type="submit" className="w-full sm:w-auto">
                Confirmer la réservation
              </Button>
            </p>
            <p className="text-sm text-muted">
              Provisoire : l'envoi n'est pas encore branché, ce bouton ne fait rien.
            </p>
          </section>
        </form>
      </Section>
    </>
  );
}
