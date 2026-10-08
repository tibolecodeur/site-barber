import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Parcours /reserver sur mobile (Android et iPhone), contre la fausse base de données
 * (src/lib/fakeDb.ts) : ses dispos sont recalculées à partir d'aujourd'hui à chaque chargement.
 * Dispos de démonstration : aujourd'hui 9 h–21 h, puis mardi, mercredi, vendredi, samedi ;
 * rien le dimanche ni le lundi.
 */
test.skip(({ isMobile }) => !isMobile, "Parcours testé sur les projets mobiles");

const JOUR = /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) \d/;

/** Les jours du calendrier ont un bouton radio masqué : on touche son libellé visible. */
async function toucherJour(jour: Locator) {
  await jour.locator("xpath=ancestor::label[1]").click();
  await expect(jour).toBeChecked();
}

async function continuer(page: Page) {
  await page.getByRole("button", { name: "Continuer" }).click();
}

/** Parcourt les jours jusqu'au premier qui a des créneaux ; renvoie le groupe de créneaux. */
async function choisirUnJourAvecCreneaux(page: Page): Promise<Locator> {
  const jours = page.getByRole("radio", { name: JOUR });
  const creneaux = page.getByRole("group", { name: /^Créneaux libres/ });
  const aucun = page.getByText(/^Aucun créneau libre/);
  const total = await jours.count();
  for (let i = 0; i < total; i++) {
    await toucherJour(jours.nth(i));
    await expect(creneaux.or(aucun)).toBeVisible();
    if (await creneaux.isVisible()) return creneaux;
  }
  throw new Error("Aucun jour avec des créneaux dans les 4 semaines");
}

/** Étapes 1 et 2 : prestation « Coupe », lieu donné (ou « Peu importe »). */
async function allerAuxCreneaux(page: Page, lieu = "Peu importe") {
  await page.goto("/reserver");
  await expect(page.getByRole("heading", { level: 2, name: "Quelle prestation ?" })).toBeVisible();
  await page
    .getByRole("radio", { name: /^Coupe/ })
    .first()
    .check();
  await continuer(page);
  await expect(page.getByRole("heading", { level: 2, name: "Où ?" })).toBeFocused();
  await page.getByRole("radio", { name: new RegExp(`^${lieu}`) }).check();
  await continuer(page);
  await expect(
    page.getByRole("heading", { level: 2, name: "Quel jour, quelle heure ?" }),
  ).toBeFocused();
}

test("parcours complet : réserver, puis annuler avec le lien personnel", async ({ page }) => {
  const erreurs: string[] = [];
  page.on("pageerror", (e) => erreurs.push(e.message));

  // Étape 1 : impossible de continuer sans prestation.
  await page.goto("/reserver");
  await expect(page.getByText("Étape 1 sur 5")).toBeVisible();
  await continuer(page);
  await expect(page.getByText("Choisis une prestation pour continuer.")).toBeVisible();

  await allerAuxCreneaux(page);

  // Étape 3 : jour puis créneau.
  await continuer(page);
  await expect(page.getByText("Choisis un jour, puis un créneau.")).toBeVisible();
  const creneaux = await choisirUnJourAvecCreneaux(page);
  const premier = creneaux.getByRole("radio").first();
  await premier.check();
  await continuer(page);

  // Étape 4 : coordonnées, avec validation.
  await expect(page.getByRole("heading", { level: 2, name: "Tes coordonnées" })).toBeFocused();
  await continuer(page);
  await expect(page.getByText("Indique ton prénom.")).toBeVisible();
  await expect(page.getByText("Laisse au moins un téléphone ou un email.")).toBeVisible();
  await expect(page.getByText("Coche la case pour pouvoir réserver.")).toBeVisible();
  await expect(page.getByLabel("Prénom")).toBeFocused();

  await page.getByLabel("Prénom").fill("Zoé");
  await page.getByLabel("Nom", { exact: true }).fill("Durand");
  await page.getByLabel("Téléphone").fill("06 39 98 00 10");
  await page.getByRole("checkbox", { name: /J'accepte/ }).check();
  await continuer(page);

  // Étape 5 : récapitulatif.
  await expect(page.getByRole("heading", { level: 2, name: "Vérifie et confirme" })).toBeFocused();
  await expect(page.getByText("Zoé Durand")).toBeVisible();
  await expect(page.getByText("06 39 98 00 10")).toBeVisible();
  await page.getByRole("button", { name: "Confirmer la réservation" }).click();

  // Confirmation : adresse exacte et lien d'annulation.
  await expect(page.getByRole("heading", { level: 2, name: "C'est réservé !" })).toBeFocused();
  await expect(page.getByText(/adresse fictive/)).toBeVisible();
  await expect(page.getByText(/\/annuler\?token=[0-9a-f-]{36}$/)).toBeVisible();

  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations.map((v) => v.id)).toEqual([]);

  // Annulation avec le lien personnel (même onglet : la fausse base est en mémoire).
  const lienAnnulation = page.getByRole("link", { name: "Ouvrir ma page d'annulation" });
  expect((await lienAnnulation.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await lienAnnulation.click();
  await expect(page).toHaveURL(/\/annuler\?token=/);
  await expect(page.getByRole("heading", { level: 2, name: "Zoé, ton rendez-vous" })).toBeVisible();
  await page.getByRole("button", { name: "Annuler mon rendez-vous" }).click();
  await expect(page.getByText("L'annulation est définitive. Tu confirmes ?")).toBeVisible();
  await page.getByRole("button", { name: "Oui, annuler" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "C'est annulé" })).toBeFocused();

  expect(erreurs).toEqual([]);
});

test("coordonnées : champs à 16 px, zones tactiles de 44 px, honeypot hors écran", async ({
  page,
}) => {
  await allerAuxCreneaux(page);
  const creneaux = await choisirUnJourAvecCreneaux(page);
  await creneaux.getByRole("radio").first().check();
  await continuer(page);
  await expect(page.getByRole("heading", { level: 2, name: "Tes coordonnées" })).toBeVisible();

  // Le piège à robots existe mais reste invisible et hors du parcours clavier.
  const honeypot = page.locator("#booking-website");
  await expect(honeypot).toHaveCount(1);
  await expect(honeypot).not.toBeInViewport();
  await expect(honeypot).toHaveAttribute("tabindex", "-1");

  const champs = page.locator("form input:not(#booking-website)");
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
  expect(mesures.length).toBe(5);
  for (const { name, hauteur, police } of mesures) {
    expect(hauteur, `zone tactile de ${name}`).toBeGreaterThanOrEqual(44);
    expect(police, `taille du texte de ${name}`).toBeGreaterThanOrEqual(16);
  }
  await expect(page.getByLabel("Téléphone")).toHaveAttribute("type", "tel");
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
});

test("aucun créneau un lundi ; le filtre de lieu propose l'autre lieu", async ({ page }) => {
  await allerAuxCreneaux(page, "Chez ses parents");

  // Le dernier lundi du calendrier n'est jamais aujourd'hui (seul jour à dispo exceptionnelle).
  await toucherJour(page.getByRole("radio", { name: /^lundi / }).last());
  await expect(page.getByText(/^Aucun créneau libre le lundi/)).toBeVisible();
  await expect(page.getByText("Essaie un autre jour.")).toBeVisible();
  await continuer(page);
  await expect(page.getByText("Choisis un créneau.")).toBeVisible();

  // Le mardi, seul « Chez lui » est ouvert : le filtre « Chez ses parents » vide la liste.
  await toucherJour(page.getByRole("radio", { name: /^mardi / }).last());
  await expect(page.getByText(/^Aucun créneau libre le mardi/)).toBeVisible();
  await expect(page.getByText(/Il reste des créneaux dans l'autre lieu/)).toBeVisible();

  // Retour à « Peu importe » : les créneaux du mardi apparaissent.
  await page.getByRole("button", { name: "Retour" }).click();
  await page.getByRole("radio", { name: /^Peu importe/ }).check();
  await continuer(page);
  await expect(page.getByRole("radio", { name: /^mardi / }).last()).toBeChecked();
  await expect(page.getByRole("group", { name: /^Créneaux libres le mardi/ })).toBeVisible();
});
