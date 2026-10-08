import { Link, NavLink } from "react-router";

/**
 * Ancres vers les sections de l'accueil. Préfixées par "/" pour marcher depuis n'importe
 * quelle page. Un simple <Link> et pas <NavLink> : NavLink ne compare que le chemin ("/"),
 * il marquerait les trois ancres comme actives en même temps sur l'accueil.
 */
const ANCHOR_LINKS = [
  { to: "/#prestations", label: "Prestations" },
  { to: "/#galerie", label: "Galerie" },
  { to: "/#reserver", label: "Comment réserver" },
] as const;

/**
 * Zone tactile d'au moins 44 px (min-h-tap). La couleur est héritée de l'en-tête (blanc sur
 * le hero, noir sur fond clair) ; le lien de la page courante est souligné.
 */
const LINK_CLASS =
  "inline-flex min-h-tap items-center text-lg font-semibold md:text-base aria-[current=page]:underline aria-[current=page]:underline-offset-4";

export function NavMenu() {
  return (
    // `aria-label` distingue ce <nav> de celui du pied de page.
    <nav aria-label="Navigation principale">
      {/* Mobile : liste verticale dans le panneau du menu ; desktop : sur une ligne. */}
      <ul className="flex flex-col pb-4 md:flex-row md:gap-x-6 md:pb-0">
        {ANCHOR_LINKS.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className={LINK_CLASS}>
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          {/* NavLink ajoute lui-même aria-current="page" quand on est sur /reserver. */}
          <NavLink to="/reserver" className={LINK_CLASS}>
            Réserver
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
