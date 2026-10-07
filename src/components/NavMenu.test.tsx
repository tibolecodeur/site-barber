import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { NavMenu } from "@/components/NavMenu";

/**
 * `MemoryRouter` garde l'URL en mémoire au lieu de toucher au navigateur : indispensable
 * ici, car <NavLink> a besoin d'un routeur parent pour savoir quel lien est actif.
 */
function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <NavMenu />
    </MemoryRouter>,
  );
}

describe("NavMenu", () => {
  it("affiche les ancres de l'accueil puis le lien vers /reserver, dans cet ordre", () => {
    renderAt("/");

    const attendus = [
      { nom: "Prestations", href: "/#prestations" },
      { nom: "Galerie", href: "/#galerie" },
      { nom: "Comment réserver", href: "/#reserver" },
      { nom: "Réserver", href: "/reserver" },
    ];
    const liens = screen.getAllByRole("link");
    expect(liens.map((lien) => lien.textContent)).toEqual(attendus.map((a) => a.nom));
    for (const { nom, href } of attendus) {
      expect(screen.getByRole("link", { name: nom })).toHaveAttribute("href", href);
    }
  });

  it("ne propose pas l'espace admin dans le menu public", () => {
    renderAt("/");
    expect(screen.queryByRole("link", { name: /admin/i })).not.toBeInTheDocument();
  });

  it("est accessible : une navigation nommée", () => {
    renderAt("/");
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
  });

  it("marque « Réserver » avec aria-current sur /reserver", () => {
    renderAt("/reserver");
    expect(screen.getByRole("link", { name: "Réserver" })).toHaveAttribute("aria-current", "page");
  });

  it("ne marque aucune ancre comme active sur l'accueil (elles pointent toutes vers /)", () => {
    renderAt("/#galerie");

    for (const nom of ["Prestations", "Galerie", "Comment réserver", "Réserver"]) {
      expect(screen.getByRole("link", { name: nom })).not.toHaveAttribute("aria-current");
    }
  });
});
