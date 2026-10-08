import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";

/** Titres provisoires (rubriques attendues par le RGPD) : contenu à rédiger avant la mise en ligne. */
const SECTIONS = [
  "Responsable du traitement",
  "Données collectées",
  "Finalité",
  "Durée de conservation",
  "Destinataires",
  "Tes droits",
  "Cookies",
];

export function PrivacyPolicyPage() {
  return (
    <>
      <PageMeta
        title="Politique de confidentialité"
        description="Comment CutsByAlix traite tes données personnelles lors d'une réservation."
      />
      <Section variant="blush">
        <h1>Politique de confidentialité</h1>
      </Section>
      <Section>
        {SECTIONS.map((section) => (
          <section key={section} className="flex flex-col gap-2">
            <h2 className="text-3xl">{section}</h2>
            <p className="text-muted">À rédiger.</p>
          </section>
        ))}
      </Section>
    </>
  );
}
