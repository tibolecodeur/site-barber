import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Audit automatique axe (Deque) sur chaque route : règles WCAG 2.x niveaux A et AA.
 * Il attrape les erreurs mécaniques (label manquant, titres sautés, lien sans nom, lang…),
 * pas tout : la navigation au clavier et la lecture d'écran restent à vérifier à la main.
 */
const ROUTES = [
  "/",
  "/reserver",
  "/annuler",
  "/admin",
  "/mentions-legales",
  "/politique-confidentialite",
  "/une-url-qui-nexiste-pas",
];

for (const route of ROUTES) {
  test(`axe : aucune violation WCAG A/AA sur ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const resultats = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();

    // On affiche l'identifiant de la règle et les éléments fautifs : lisible dans le rapport CI.
    const violations = resultats.violations.map((v) => ({
      regle: v.id,
      elements: v.nodes.map((n) => n.target.join(" ")),
    }));
    expect(violations).toEqual([]);
  });
}
