type PhotoPlaceholderProps = {
  /** Texte alternatif de la future photo. */
  alt: string;
  /** Dimensions de la future photo, en pixels : elles fixent le ratio de l'emplacement. */
  width: number;
  height: number;
};

/**
 * Emplacement PROVISOIRE d'une photo, aux proportions de la future image.
 * Réserver la place dès maintenant évite que la page « saute » quand la photo arrive (CLS).
 * À remplacer par <img src alt width height loading="lazy"> (sans `lazy` pour le hero,
 * visible dès l'arrivée sur la page).
 */
export function PhotoPlaceholder({ alt, width, height }: PhotoPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className="flex w-full items-center justify-center border p-4"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* Texte visible seulement : le nom accessible est déjà porté par aria-label. */}
      <span aria-hidden="true">Photo à venir</span>
    </div>
  );
}
