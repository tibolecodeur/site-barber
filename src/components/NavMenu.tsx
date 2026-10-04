import { NavLink } from "react-router";

/** Liens du menu principal. Un seul endroit à modifier pour ajouter une page. */
const LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/prestations", label: "Prestations" },
  { to: "/galerie", label: "Galerie" },
  { to: "/reserver", label: "Réserver" },
  { to: "/admin", label: "Admin" },
] as const;

export function NavMenu() {
  return (
    // `aria-label` distingue ce <nav> d'un éventuel autre (pied de page, fil d'Ariane).
    <nav aria-label="Navigation principale">
      <ul>
        {LINKS.map((link) => (
          <li key={link.to}>
            {/* NavLink ajoute lui-même aria-current="page" sur le lien actif. */}
            <NavLink to={link.to} end={link.to === "/"}>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
