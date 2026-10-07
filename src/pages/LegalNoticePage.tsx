import { PageMeta } from "@/components/PageMeta";

/** Titres provisoires : le contenu sera rédigé avant la mise en ligne. */
const SECTIONS = ["Éditeur du site", "Hébergement", "Propriété intellectuelle", "Contact"];

export function LegalNoticePage() {
  return (
    <>
      <PageMeta title="Mentions légales" description="Mentions légales du site CutsByAlix." />
      <h1>Mentions légales</h1>
      {SECTIONS.map((section) => (
        <section key={section} className="py-3">
          <h2>{section}</h2>
          <p>À rédiger.</p>
        </section>
      ))}
    </>
  );
}
