import type { SubmitEvent } from "react";
import { Link } from "react-router";
import { PageMeta } from "@/components/PageMeta";
import { PROVISIONAL_SERVICES } from "@/features/booking/provisionalServices";

const STEP_CLASS = "flex flex-col gap-2";
const FIELD_CLASS = "flex flex-col gap-1";
const CHOICE_CLASS = "flex min-h-11 items-center gap-2";

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
      <h1>Réserver</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
        <fieldset className={STEP_CLASS}>
          <legend>
            <h2>1. Prestation</h2>
          </legend>
          {PROVISIONAL_SERVICES.map((service) => (
            <label key={service.id} className={CHOICE_CLASS}>
              <input type="radio" name="service" value={service.id} />
              {service.name} ({service.durationMin} min, prix : {service.priceLabel})
            </label>
          ))}
        </fieldset>

        <section aria-labelledby="booking-step-day" className={STEP_CLASS}>
          <h2 id="booking-step-day">2. Jour</h2>
          <div className={FIELD_CLASS}>
            <label htmlFor="booking-day">Jour du rendez-vous</label>
            <input id="booking-day" name="day" type="date" />
          </div>
        </section>

        <section aria-labelledby="booking-step-slot" className={STEP_CLASS}>
          <h2 id="booking-step-slot">3. Créneau</h2>
          <p>Les créneaux libres du jour choisi s'afficheront ici.</p>
        </section>

        <fieldset className="flex flex-col gap-4">
          <legend>
            <h2>4. Vos coordonnées</h2>
          </legend>
          <div className={FIELD_CLASS}>
            <label htmlFor="booking-first-name">Prénom</label>
            <input id="booking-first-name" name="firstName" type="text" autoComplete="given-name" />
          </div>
          <div className={FIELD_CLASS}>
            <label htmlFor="booking-last-name">Nom</label>
            <input id="booking-last-name" name="lastName" type="text" autoComplete="family-name" />
          </div>
          {/* Consigne lue par les lecteurs d'écran à l'arrivée sur chacun des deux champs. */}
          <p id="booking-contact-hint">Téléphone et/ou email : au moins l'un des deux.</p>
          <div className={FIELD_CLASS}>
            <label htmlFor="booking-phone">Téléphone</label>
            <input
              id="booking-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              aria-describedby="booking-contact-hint"
            />
          </div>
          <div className={FIELD_CLASS}>
            <label htmlFor="booking-email">Email</label>
            <input
              id="booking-email"
              name="email"
              type="email"
              autoComplete="email"
              aria-describedby="booking-contact-hint"
            />
          </div>
        </fieldset>

        <section aria-labelledby="booking-step-consent" className={STEP_CLASS}>
          <h2 id="booking-step-consent">5. Consentement</h2>
          <label className={CHOICE_CLASS}>
            <input type="checkbox" name="consent" />
            J'accepte que ces informations servent uniquement à gérer mon rendez-vous.
          </label>
          <p>
            <Link to="/politique-confidentialite" className="inline-flex min-h-11 items-center">
              Lire la politique de confidentialité
            </Link>
          </p>
        </section>

        <section aria-labelledby="booking-step-confirmation" className={STEP_CLASS}>
          <h2 id="booking-step-confirmation">6. Confirmation</h2>
          <p>Paiement en liquide, sur place. Le lieu exact s'affichera après la réservation.</p>
          <p>
            <button type="submit" className="min-h-11 border px-4">
              Confirmer la réservation
            </button>
          </p>
          <p>Provisoire : l'envoi n'est pas encore branché, ce bouton ne fait rien.</p>
        </section>
      </form>
    </>
  );
}
