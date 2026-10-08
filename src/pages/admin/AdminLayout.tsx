import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { LoadingMessage } from "@/components/StatusMessage";
import { useScrollToHash } from "@/components/useScrollToHash";
import { getSession, signOut, type AdminSession } from "@/features/admin/data";
import { useAsync } from "@/lib/useAsync";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import type { AdminContext } from "@/pages/admin/useAdmin";

const NAV_LINKS = [
  { to: "/admin", label: "Accueil", end: true },
  { to: "/admin/rendez-vous", label: "RDV", end: false },
  { to: "/admin/disponibilites", label: "Dispos", end: false },
  { to: "/admin/galerie", label: "Galerie", end: false },
  { to: "/admin/compte", label: "Compte", end: false },
] as const;

/**
 * Gabarit de l'espace admin (`/admin/*`), distinct de celui du site public : aucun lien
 * vers lui depuis le site.
 *
 * Il joue le rôle du pare-feu de Symfony : sans session, il affiche la connexion À LA
 * PLACE de la page demandée ; avec session, il affiche la page dans son `<Outlet />`.
 * Ce n'est qu'un confort d'affichage : la vraie protection des données, c'est la RLS de
 * Supabase (un visiteur non admin ne lit rien, même en appelant l'API à la main).
 *
 * Mobile : barre de navigation fixée en bas, à portée de pouce, au-dessus de la barre
 * d'accueil iOS (`env(safe-area-inset-bottom)`). Desktop : dans l'en-tête.
 */
export function AdminLayout() {
  // Comme le site public : retour en haut de page à chaque navigation.
  useScrollToHash();
  const initial = useAsync("admin-session", getSession);
  // Après une connexion ou une déconnexion, on remplace la session lue au chargement.
  const [override, setOverride] = useState<{ session: AdminSession | null } | null>(null);
  const session = override ? override.session : initial.status === "success" ? initial.data : null;

  async function handleSignOut() {
    await signOut();
    setOverride({ session: null });
  }

  if (override === null && initial.status === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center px-safe">
        <LoadingMessage>Chargement…</LoadingMessage>
      </main>
    );
  }

  if (session === null) {
    return <AdminLoginPage onSignedIn={(signedIn) => setOverride({ session: signedIn })} />;
  }

  const context: AdminContext = { session, onSignOut: handleSignOut };
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only z-50 bg-surface px-4 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-[env(safe-area-inset-top)] focus:left-2 focus:inline-flex focus:min-h-tap focus:items-center"
      >
        Aller au contenu
      </a>
      <header className="border-b border-ink/10 bg-surface pt-[env(safe-area-inset-top)] text-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-safe">
          <Link
            to="/admin"
            className="title-display inline-flex min-h-header items-center text-2xl uppercase"
          >
            CutsByAlix <span className="ml-2 text-base not-italic">admin</span>
          </Link>
          <nav
            aria-label="Navigation admin"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/15 bg-surface pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:pb-0"
          >
            <ul className="grid grid-cols-5 px-[env(safe-area-inset-left)] md:flex md:gap-6 md:px-0">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className="flex min-h-[3.5rem] items-center justify-center border-t-4 border-transparent text-sm font-semibold aria-[current=page]:border-ink aria-[current=page]:font-bold md:min-h-tap md:border-t-0 md:border-b-4 md:text-base"
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      {/* Marge basse sur mobile : le contenu ne finit pas caché sous la barre de navigation. */}
      <main
        id="contenu"
        tabIndex={-1}
        className="w-full flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0"
      >
        <Outlet context={context} />
      </main>
    </div>
  );
}
