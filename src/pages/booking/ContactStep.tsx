import { useState, type SubmitEvent } from "react";
import { Link } from "react-router";
import { Choice } from "@/components/Choice";
import { Field } from "@/components/Field";
import {
  validateContact,
  type ContactErrors,
  type ContactForm,
} from "@/features/booking/validation";
import { GroupError, StepActions, StepFrame } from "@/pages/booking/StepFrame";

/** Identifiant HTML de chaque champ, pour y placer le focus en cas d'erreur. */
const FIELD_IDS: Record<keyof ContactForm, string> = {
  firstName: "booking-first-name",
  lastName: "booking-last-name",
  phone: "booking-phone",
  email: "booking-email",
  consent: "booking-consent",
};

type ContactStepProps = {
  contact: ContactForm;
  website: string;
  focusOnMount: boolean;
  onChange: (contact: ContactForm) => void;
  onWebsiteChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
};

/** Étape 4 : coordonnées, minimum RGPD (prénom, nom, téléphone et/ou email), consentement. */
export function ContactStep(props: ContactStepProps) {
  const { contact, focusOnMount } = props;
  const [errors, setErrors] = useState<ContactErrors>({});

  // Formulaire « contrôlé » : React détient la valeur de chaque champ (comme un objet de
  // formulaire Symfony hydraté à chaque frappe) ; le parent la garde pour le récapitulatif.
  function update<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    props.onChange({ ...contact, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateContact(contact);
    setErrors(found);
    // Focus sur le premier champ en erreur : le clavier et le lecteur d'écran y vont direct.
    const firstInvalid = (Object.keys(FIELD_IDS) as (keyof ContactForm)[]).find((k) => found[k]);
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }
    props.onNext();
  }

  return (
    <StepFrame number={3} title="Tes coordonnées" focusOnMount={focusOnMount}>
      {/* noValidate : on affiche nos propres messages, au tutoiement, sous chaque champ. */}
      <form onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-5">
        <Field
          id={FIELD_IDS.firstName}
          name="firstName"
          type="text"
          autoComplete="given-name"
          label="Prénom"
          value={contact.firstName}
          onChange={(e) => update("firstName", e.target.value)}
          error={errors.firstName}
          maxLength={50}
        />
        <Field
          id={FIELD_IDS.lastName}
          name="lastName"
          type="text"
          autoComplete="family-name"
          label="Nom"
          value={contact.lastName}
          onChange={(e) => update("lastName", e.target.value)}
          error={errors.lastName}
          maxLength={50}
        />
        <p id="booking-contact-hint" className="text-muted">
          Téléphone et/ou email : au moins l'un des deux, pour te joindre en cas d'imprévu.
        </p>
        <Field
          id={FIELD_IDS.phone}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          label="Téléphone"
          describedBy="booking-contact-hint"
          value={contact.phone}
          onChange={(e) => update("phone", e.target.value)}
          error={errors.phone}
        />
        <Field
          id={FIELD_IDS.email}
          name="email"
          type="email"
          autoComplete="email"
          label="Email"
          describedBy="booking-contact-hint"
          value={contact.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
        />

        {/* Piège à robots (honeypot) : hors de l'écran, ignoré par les lecteurs d'écran et
            absent du parcours clavier. Un humain le laisse vide ; un robot qui remplit tous
            les champs se trahit, et la base refuse la réservation. */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label htmlFor="booking-website">Site web (laisse ce champ vide)</label>
          <input
            id="booking-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={props.website}
            onChange={(e) => props.onWebsiteChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Choice
            id={FIELD_IDS.consent}
            type="checkbox"
            name="consent"
            checked={contact.consent}
            onChange={(e) => update("consent", e.target.checked)}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "booking-consent-error" : undefined}
          >
            J'accepte que ces informations servent uniquement à gérer mon rendez-vous.
          </Choice>
          <GroupError id="booking-consent-error" message={errors.consent} />
          <p>
            <Link
              to="/politique-confidentialite"
              className="link inline-flex min-h-tap items-center"
            >
              Lire la politique de confidentialité
            </Link>
          </p>
        </div>

        <StepActions onBack={props.onBack} submitLabel="Continuer" />
      </form>
    </StepFrame>
  );
}
