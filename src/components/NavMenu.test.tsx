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
  it("affiche un lien vers chaque page publique", () => {
    renderAt("/");

    const attendus = [
      { nom: "Accueil", href: "/" },
      { nom: "Prestations", href: "/prestations" },
      { nom: "Galerie", href: "/galerie" },
      { nom: "Réserver", href: "/reserver" },
      { nom: "Admin", href: "/admin" },
    ];
    for (const { nom, href } of attendus) {
      expect(screen.getByRole("link", { name: nom })).toHaveAttribute("href", href);
    }
    expect(screen.getAllByRole("link")).toHaveLength(attendus.length);
  });

  it("est accessible : une navigation nommée", () => {
    renderAt("/");
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
  });

  it("marque la page courante avec aria-current", () => {
    renderAt("/galerie");

    expect(screen.getByRole("link", { name: "Galerie" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Accueil" })).not.toHaveAttribute("aria-current");
  });

  it("ne marque pas Accueil comme actif sur une autre page (grâce à `end`)", () => {
    renderAt("/prestations");

    // Sans `end`, le chemin "/" correspondrait à toutes les URL : piège classique de NavLink.
    expect(screen.getByRole("link", { name: "Accueil" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Prestations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
