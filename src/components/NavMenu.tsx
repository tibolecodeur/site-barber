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

/** Classes communes : zone tactile d'au moins 44 px de haut (min-h-11). */
const LINK_CLASS = "inline-flex min-h-11 items-center";

export function NavMenu() {
  return (
    // `aria-label` distingue ce <nav> de celui du pied de page.
    <nav aria-label="Navigation principale">
      {/* Liste simple qui passe à la ligne sur petit écran, sans menu burger. */}
      <ul className="flex flex-wrap gap-x-4">
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
