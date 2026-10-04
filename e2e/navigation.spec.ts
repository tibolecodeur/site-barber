import { expect, test } from "@playwright/test";

/** Chaque route publique et le titre attendu sur la page. */
const PAGES = [
  { chemin: "/", titre: "Accueil" },
  { chemin: "/prestations", titre: "Prestations" },
  { chemin: "/galerie", titre: "Galerie" },
  { chemin: "/reserver", titre: "Réserver" },
  { chemin: "/annuler", titre: "Annuler ma réservation" },
  { chemin: "/admin", titre: "Espace admin" },
  { chemin: "/une-url-qui-nexiste-pas", titre: "Page introuvable" },
];

for (const { chemin, titre } of PAGES) {
  test(`la page ${chemin} affiche « ${titre} »`, async ({ page }) => {
    const erreurs: string[] = [];
    page.on("pageerror", (e) => erreurs.push(e.message));

    await page.goto(chemin);

    await expect(page.getByRole("heading", { level: 1, name: titre })).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test("le menu permet de naviguer entre les pages", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Galerie" }).click();
  await expect(page).toHaveURL("/galerie");
  await expect(page.getByRole("heading", { level: 1, name: "Galerie" })).toBeVisible();

  await page.getByRole("link", { name: "Accueil" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: "Accueil" })).toBeVisible();
});
