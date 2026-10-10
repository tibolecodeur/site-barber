import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "./fixtures.ts";

/**
 * Espace admin sur mobile, avec le faux état connecté (serveur de développement seulement ;
 * son absence du build de production est prouvée par devSession.build.test.ts).
 */
test.skip(({ isMobile }) => !isMobile, "Parcours testé sur les projets mobiles");

/**
 * Jour de semaine voulu (0 = dimanche… 2 = mardi) dans 2 à 3 semaines, au format ISO local.
 * Démo : le mardi est ouvert de 14 h à 18 h « Saint-Christophe-du-Bois », le lundi n'a aucune dispo.
 */
function jourDansDeuxSemaines(jourSemaine: number): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  while (date.getDay() !== jourSemaine) date.setDate(date.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

test("connexion, ajout d'une disponibilité, déconnexion", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Espace admin" })).toBeVisible();
  await page.getByLabel("Email").fill("alix@example.com");
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Aujourd'hui" })).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations.map((v) => v.id)).toEqual([]);

  // Navigation du bas d'écran : visible et à portée de pouce.
  const nav = page.getByRole("navigation", { name: "Navigation admin" });
  await nav.getByRole("link", { name: "Dispos" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Disponibilités" })).toBeVisible();

  // Chevauchement refusé : ce mardi est déjà ouvert de 14 h à 18 h (14 h–18 h par défaut).
  await page.getByRole("radio", { name: /^Saint-Christophe-du-Bois/ }).check();
  await page.getByLabel("Jour").fill(jourDansDeuxSemaines(2));
  await page.getByRole("button", { name: "Ajouter la disponibilité" }).click();
  await expect(page.getByText(/chevauche une autre disponibilité/)).toBeVisible();

  await page.getByLabel("Jour").fill(jourDansDeuxSemaines(1));
  await page.getByRole("button", { name: "Ajouter la disponibilité" }).click();
  await expect(page.getByText(/^Disponibilité ajoutée : lundi/)).toBeVisible();

  await nav.getByRole("link", { name: "Compte" }).click();
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Espace admin" })).toBeVisible();
});
