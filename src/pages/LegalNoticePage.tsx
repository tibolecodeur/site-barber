import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";

/** Titres provisoires : le contenu sera rédigé avant la mise en ligne. */
const SECTIONS = ["Éditeur du site", "Hébergement", "Propriété intellectuelle", "Contact"];

export function LegalNoticePage() {
  return (
    <>
      <PageMeta title="Mentions légales" description="Mentions légales du site CutsByAlix." />
      <Section variant="blush">
        <h1>Mentions légales</h1>
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
