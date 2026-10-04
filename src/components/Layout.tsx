import { Outlet } from "react-router";
import { NavMenu } from "@/components/NavMenu";

/**
 * Gabarit partagé par toutes les pages.
 * `<Outlet />` est l'emplacement où React Router insère la page correspondant à l'URL
 * (l'équivalent du `{% block body %}` d'un template Twig).
 */
export function Layout() {
  return (
    <>
      <header>
        <NavMenu />
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
