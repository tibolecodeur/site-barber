type PageMetaProps = {
  /** Titre propre à la page ; le nom du site est ajouté automatiquement. */
  title?: string;
  description: string;
};

const SITE_NAME = "CutsByAlix";

/**
 * Titre d'onglet et meta description de la page courante.
 * React 19 « hisse » lui-même <title> et <meta> dans le <head>, où qu'on les rende dans
 * l'arbre : pas besoin de librairie (react-helmet) pour ça.
 */
export function PageMeta({ title, description }: PageMetaProps) {
  return (
    <>
      <title>{title ? `${title} · ${SITE_NAME}` : SITE_NAME}</title>
      <meta name="description" content={description} />
    </>
  );
}
