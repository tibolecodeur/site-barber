import { useSyncExternalStore } from "react";

/** Défilement et redimensionnement (le seuil dépend souvent de la hauteur de fenêtre). */
function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

/**
 * Vrai quand la page a défilé au-delà du seuil (en pixels) renvoyé par `getThreshold`.
 *
 * Le seuil est une fonction, relue à chaque événement, pour suivre les changements de taille
 * de fenêtre (rotation du téléphone, barre d'adresse mobile qui se replie).
 * `getSnapshot` renvoie un booléen : React ne re-rend que lorsqu'il change, pas à chaque pixel.
 */
export function useScrolledPast(getThreshold: () => number): boolean {
  return useSyncExternalStore(subscribe, () => window.scrollY > getThreshold());
}
