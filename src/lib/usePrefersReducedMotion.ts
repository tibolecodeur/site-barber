import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Vrai si le navigateur sait évaluer une media query (absent dans certains environnements de test). */
function canMatchMedia() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function subscribe(onChange: () => void) {
  if (!canMatchMedia()) return () => {};
  const mediaQuery = window.matchMedia(QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSnapshot() {
  return canMatchMedia() && window.matchMedia(QUERY).matches;
}

/**
 * Vrai si l'utilisateur a demandé à réduire les animations (réglage système).
 *
 * `useSyncExternalStore` branche React sur une source extérieure (ici le navigateur) : React
 * lit la valeur pendant le rendu (`getSnapshot`) et re-rend le composant quand `subscribe`
 * signale un changement. La valeur est donc juste dès le PREMIER rendu (pas d'aller-retour
 * par un useEffect), et suit le réglage si l'utilisateur le modifie page ouverte.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
