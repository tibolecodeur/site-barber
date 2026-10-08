import { expect, test } from "./fixtures.ts";

/**
 * Hero de l'accueil, sur mobile (projets mobile-android et mobile-iphone).
 * Sur desktop, le bouton est dans le hero et non collé en bas : comportement différent.
 */
test.describe("hero mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "comportement propre au mobile");

  test("affiche le logo et UN bouton « Réserver » collé en bas, cliquable", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator("#accueil");
    await expect(hero.getByRole("heading", { level: 1, name: "CutsByAlix" })).toBeVisible();

    // Un seul bouton « Réserver » visible à l'écran (les autres sont réservés au desktop).
    const reserver = page
      .getByRole("link", { name: "Réserver", exact: true })
      .filter({ visible: true });
    await expect(reserver).toHaveCount(1);
    await expect(reserver).toBeInViewport();

    // Collé en bas : son bord inférieur est dans les 40 derniers pixels de l'écran.
    const viewport = page.viewportSize()!;
    const boite = (await reserver.boundingBox())!;
    expect(boite.y + boite.height).toBeGreaterThan(viewport.height - 40);
    expect(boite.y + boite.height).toBeLessThanOrEqual(viewport.height);
    expect(boite.height).toBeGreaterThanOrEqual(44);

    await reserver.click();
    await expect(page).toHaveURL("/reserver");
    await expect(page.getByRole("heading", { level: 1, name: "Réserver" })).toBeVisible();
  });

  test("n'affiche aucune vidéo si l'utilisateur réduit les animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "CutsByAlix" })).toBeVisible();
    await expect(page.getByTestId("hero-media")).toBeAttached();
    await expect(page.locator("video")).toHaveCount(0);
  });
});
