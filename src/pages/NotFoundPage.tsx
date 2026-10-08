import { ButtonLink } from "@/components/Button";
import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";

export function NotFoundPage() {
  return (
    <>
      <PageMeta title="Page introuvable" description="Cette page n'existe pas." />
      <Section variant="blush">
        <h1>Page introuvable</h1>
      </Section>
      <Section>
        <p>
          <ButtonLink to="/" variant="secondary">
            Retour à l'accueil
          </ButtonLink>
        </p>
      </Section>
    </>
  );
}
