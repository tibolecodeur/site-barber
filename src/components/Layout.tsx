import { NavLink, Outlet } from "react-router";
import { NavMenu } from "@/components/NavMenu";
import { useScrollToHash } from "@/components/useScrollToHash";

const LINK_CLASS = "inline-flex min-h-11 items-center";

/**
 * Gabarit partagé par toutes les pages.
 * `<Outlet />` est l'emplacement où React Router insère la page correspondant à l'URL
 * (l'équivalent du `{% block body %}` d'un template Twig).
 *
 * Le conteneur applique les marges de zones sûres (encoche, barre d'accueil iOS) :
 * en haut pour l'en-tête, en bas pour le pied de page, et sur les côtés (iPhone en paysage).
 */
export function Layout() {
  useScrollToHash();

  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      {/* Lien d'évitement : invisible jusqu'à ce qu'il reçoive le focus clavier. */}
      <a href="#contenu" className={`sr-only focus:not-sr-only ${LINK_CLASS} px-4`}>
        Aller au contenu
      </a>

      <header className="mx-auto w-full max-w-3xl px-4 py-2">
        <NavLink to="/" end className={LINK_CLASS}>
          CutsByAlix
        </NavLink>
        <NavMenu />
      </header>

      {/* tabIndex -1 : le lien d'évitement peut y placer le focus, sans l'ajouter au parcours Tab. */}
      <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 py-4">
        <nav aria-label="Informations légales">
          <ul className="flex flex-wrap gap-x-4">
            <li>
              <NavLink to="/mentions-legales" className={LINK_CLASS}>
                Mentions légales
              </NavLink>
            </li>
            <li>
              <NavLink to="/politique-confidentialite" className={LINK_CLASS}>
                Politique de confidentialité
              </NavLink>
            </li>
          </ul>
        </nav>
      </footer>
    </div>
  );
}
