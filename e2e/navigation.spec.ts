import { expect, test, type Page } from "@playwright/test";

/** Chaque route, son titre h1 et le titre d'onglet attendu. */
const PAGES = [
  { chemin: "/", h1: "CutsByAlix", onglet: "CutsByAlix" },
  { chemin: "/reserver", h1: "Réserver", onglet: "Réserver · CutsByAlix" },
  {
    chemin: "/annuler",
    h1: "Annuler ma réservation",
    onglet: "Annuler ma réservation · CutsByAlix",
  },
  { chemin: "/admin", h1: "Espace admin", onglet: "Espace admin · CutsByAlix" },
  { chemin: "/mentions-legales", h1: "Mentions légales", onglet: "Mentions légales · CutsByAlix" },
  {
    chemin: "/politique-confidentialite",
    h1: "Politique de confidentialité",
    onglet: "Politique de confidentialité · CutsByAlix",
  },
  {
    chemin: "/une-url-qui-nexiste-pas",
    h1: "Page introuvable",
    onglet: "Page introuvable · CutsByAlix",
  },
];

for (const { chemin, h1, onglet } of PAGES) {
  test(`la page ${chemin} affiche son titre « ${h1} »`, async ({ page }) => {
    const erreurs: string[] = [];
    page.on("pageerror", (e) => erreurs.push(e.message));

    await page.goto(chemin);

    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page).toHaveTitle(onglet);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    expect(erreurs).toEqual([]);
  });

  test(`la page ${chemin} ne déborde pas horizontalement`, async ({ page }) => {
    await page.goto(chemin);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}

test("l'accueil contient les sections dans l'ordre attendu", async ({ page }) => {
  await page.goto("/");

  const ids = await page
    .locator("main section[id]")
    .evaluateAll((sections) => sections.map((s) => s.id));
  expect(ids).toEqual(["accueil", "prestations", "galerie", "reserver"]);
});

test("l'accueil affiche les deux prestations sans prix inventé", async ({ page }) => {
  await page.goto("/");
  const prestations = page.locator("#prestations");

  await expect(prestations.getByRole("heading", { level: 3 })).toHaveText([
    "Coupe",
    "Coupe + barbe",
  ]);
  await expect(prestations.getByText("Prix : À confirmer")).toHaveCount(2);
});

/** Sur mobile, les liens sont dans un menu replié : on l'ouvre s'il y a un bouton « Menu ». */
async function ouvrirMenuSiReplie(page: Page) {
  const bouton = page.getByRole("button", { name: "Menu" });
  if (await bouton.isVisible()) {
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
  }
}

test("les ancres du menu fonctionnent depuis une autre page", async ({ page }) => {
  await page.goto("/reserver");
  const menu = page.getByRole("navigation", { name: "Navigation principale" });

  await ouvrirMenuSiReplie(page);
  await menu.getByRole("link", { name: "Galerie" }).click();
  await expect(page).toHaveURL("/#galerie");
  await expect(page.getByRole("heading", { level: 2, name: "Galerie" })).toBeInViewport();

  await ouvrirMenuSiReplie(page);
  await menu.getByRole("link", { name: "Réserver", exact: true }).click();
  await expect(page).toHaveURL("/reserver");
  await expect(page.getByRole("heading", { level: 1, name: "Réserver" })).toBeInViewport();
});

test("le pied de page mène aux pages légales", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Mentions légales" }).click();
  await expect(page).toHaveURL("/mentions-legales");
  await expect(page.getByRole("link", { name: "Mentions légales" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("link", { name: "Politique de confidentialité" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Politique de confidentialité");
});

test("le lien d'évitement mène au contenu", async ({ page, browserName }) => {
  // Safari ne donne pas le focus aux liens avec Tab par défaut (réglage système).
  test.skip(browserName === "webkit", "Tab ne parcourt pas les liens dans WebKit par défaut");
  await page.goto("/reserver");

  await page.keyboard.press("Tab");
  const lienEvitement = page.getByRole("link", { name: "Aller au contenu" });
  await expect(lienEvitement).toBeFocused();
  await expect(lienEvitement).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenu$/);
});

test("chaque champ de /reserver a un nom accessible (label)", async ({ page }) => {
  await page.goto("/reserver");
  // `count()` est un instantané qui n'attend pas : on attend d'abord le rendu de la page.
  await expect(page.getByRole("heading", { level: 1, name: "Réserver" })).toBeVisible();

  const champs = page.locator("form input, form select, form textarea");
  const total = await champs.count();
  expect(total).toBeGreaterThan(0);
  for (let i = 0; i < total; i++) {
    await expect(champs.nth(i)).toHaveAccessibleName(/\S/);
  }

  // Mobile : texte à 16 px minimum (sinon Safari zoome) et zones tactiles de 44 px minimum.
  // Les cases et boutons radio sont petits, mais leur label (cliquable) fait 44 px.
  const mesures = await champs.evaluateAll((els) =>
    els.map((el) => {
      const cible = el.matches('[type="checkbox"], [type="radio"]') ? el.closest("label")! : el;
      return {
        name: el.getAttribute("name"),
        hauteur: cible.getBoundingClientRect().height,
        police: parseFloat(getComputedStyle(el).fontSize),
      };
    }),
  );
  for (const { name, hauteur, police } of mesures) {
    expect(hauteur, `zone tactile de ${name}`).toBeGreaterThanOrEqual(44);
    expect(police, `taille du texte de ${name}`).toBeGreaterThanOrEqual(16);
  }

  // Types adaptés : clavier numérique pour le téléphone, clavier email pour l'email.
  await expect(page.getByLabel("Téléphone")).toHaveAttribute("type", "tel");
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
});
