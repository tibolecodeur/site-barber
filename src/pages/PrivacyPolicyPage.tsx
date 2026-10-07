import { PageMeta } from "@/components/PageMeta";

/** Titres provisoires (rubriques attendues par le RGPD) : contenu à rédiger avant la mise en ligne. */
const SECTIONS = [
  "Responsable du traitement",
  "Données collectées",
  "Finalité",
  "Durée de conservation",
  "Destinataires",
  "Vos droits",
  "Cookies",
];

export function PrivacyPolicyPage() {
  return (
    <>
      <PageMeta
        title="Politique de confidentialité"
        description="Comment CutsByAlix traite vos données personnelles lors d'une réservation."
      />
      <h1>Politique de confidentialité</h1>
      {SECTIONS.map((section) => (
        <section key={section} className="py-3">
          <h2>{section}</h2>
          <p>À rédiger.</p>
        </section>
      ))}
    </>
  );
}
