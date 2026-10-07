import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router";

/**
 * Défilement après chaque navigation interne.
 * React Router change l'URL sans recharger la page : le navigateur ne fait donc ni le saut
 * vers l'ancre (`/#galerie`) ni le retour en haut de page. Cet effet le fait à sa place,
 * instantanément (comportement par défaut de `scrollIntoView`, sans animation).
 *
 * `location.key` change à chaque navigation, même vers la même URL : un second clic sur
 * « Galerie » après avoir défilé ramène bien à la section.
 *
 * Sur « Précédent » / « Suivant » (type POP), on ne touche à rien : le navigateur restaure
 * lui-même la position de défilement de la page d'où l'on revient.
 */
export function useScrollToHash() {
  const { hash, key } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, key, navigationType]);
}
