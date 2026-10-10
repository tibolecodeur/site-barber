import { AxeBuilder } from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures.ts";

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

/** Étape 1 : prestation « Coupe ». On arrive directement au choix du jour et du créneau. */
async function allerAuxCreneaux(page: Page) {
  await page.goto("/reserver");
  await expect(page.getByRole("heading", { level: 2, name: "Quelle prestation ?" })).toBeVisible();
  await page
    .getByRole("radio", { name: /^Coupe/ })
    .first()
    .check();
  await continuer(page);
  await expect(
    page.getByRole("heading", { level: 2, name: "Quel jour, quelle heure ?" }),
  ).toBeFocused();
  await expect(page.getByText("Étape 2 sur 4")).toBeVisible();
}

/** Valeur d'une ligne du récapitulatif (<dt>libellé</dt><dd>valeur</dd>). */
function valeurDuRecap(page: Page, libelle: string): Locator {
  return page
    .locator("dt", { hasText: new RegExp(`^${libelle}$`) })
    .locator("xpath=following-sibling::dd[1]");
}

/** Texte visible d'un créneau (son libellé), espaces normalisés. */
async function texteDuCreneau(creneau: Locator): Promise<string> {
  return creneau.evaluate((el) => el.closest("label")!.textContent!.replace(/\s+/g, " ").trim());
}

const LIEU_EN_FIN = /(Chez lui|Chez ses parents)$/;

test("parcours complet : réserver, puis annuler avec le lien personnel", async ({ page }) => {
  const erreurs: string[] = [];
  page.on("pageerror", (e) => erreurs.push(e.message));

  // Étape 1 : impossible de continuer sans prestation.
  await page.goto("/reserver");
  await expect(page.getByText("Étape 1 sur 4")).toBeVisible();
  await continuer(page);
  await expect(page.getByText("Choisis une prestation pour continuer.")).toBeVisible();

  await allerAuxCreneaux(page);

  // Étape 2 : jour puis créneau. Le client ne choisit jamais de lieu.
  await expect(page.getByRole("heading", { name: "Où ?" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: /Peu importe/ })).toHaveCount(0);
  await continuer(page);
  await expect(page.getByText("Choisis un jour, puis un créneau.")).toBeVisible();
  const creneaux = await choisirUnJourAvecCreneaux(page);
  const premier = creneaux.getByRole("radio").first();
  // Le créneau affiche le libellé public de son lieu, jamais l'adresse.
  const texte = await texteDuCreneau(premier);
  const lieu = LIEU_EN_FIN.exec(texte)?.[1];
  expect(lieu, `lieu affiché sur le créneau « ${texte} »`).toBeDefined();
  await expect(creneaux).not.toContainText("fictive");
  await premier.check();
  await continuer(page);

  // Étape 3 : coordonnées, avec validation.
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

  // Étape 4 : récapitulatif, avec le lieu du créneau choisi et sans adresse.
  await expect(page.getByRole("heading", { level: 2, name: "Vérifie et confirme" })).toBeFocused();
  await expect(page.getByText("Zoé Durand")).toBeVisible();
  await expect(page.getByText("06 39 98 00 10")).toBeVisible();
  await expect(valeurDuRecap(page, "Lieu")).toHaveText(lieu!);
  await expect(page.getByText(/adresse fictive/)).toHaveCount(0);
  await page.getByRole("button", { name: "Confirmer la réservation" }).click();

  // Confirmation : lieu du créneau, adresse exacte et lien d'annulation.
  await expect(page.getByRole("heading", { level: 2, name: "C'est réservé !" })).toBeFocused();
  await expect(valeurDuRecap(page, "Lieu")).toHaveText(lieu!);
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

test("aucun créneau un lundi ; chaque créneau affiche son lieu, jamais l'adresse", async ({
  page,
}) => {
  await allerAuxCreneaux(page);

  // Le dernier lundi du calendrier n'est jamais aujourd'hui (seul jour à dispo exceptionnelle).
  await toucherJour(page.getByRole("radio", { name: /^lundi / }).last());
  await expect(page.getByText(/^Aucun créneau libre le lundi/)).toBeVisible();
  await expect(page.getByText("Essaie un autre jour.")).toBeVisible();
  await continuer(page);
  await expect(page.getByText("Choisis un créneau.")).toBeVisible();

  // Le samedi, deux dispos dans deux lieux : 10 h–13 h « Chez ses parents », 14 h–18 h
  // « Chez lui ». Chaque créneau porte le lieu de SA dispo.
  await toucherJour(page.getByRole("radio", { name: /^samedi / }).last());
  const creneaux = page.getByRole("group", { name: /^Créneaux libres le samedi/ });
  await expect(creneaux.getByRole("radio")).toHaveCount(7);
  const textes = await creneaux
    .getByRole("radio")
    .evaluateAll((els) =>
      els.map((el) => el.closest("label")!.textContent!.replace(/\s+/g, " ").trim()),
    );
  expect(textes).toEqual([
    "10:00 – 11:00Chez ses parents",
    "11:00 – 12:00Chez ses parents",
    "12:00 – 13:00Chez ses parents",
    "14:00 – 15:00Chez lui",
    "15:00 – 16:00Chez lui",
    "16:00 – 17:00Chez lui",
    "17:00 – 18:00Chez lui",
  ]);
  await expect(creneaux).not.toContainText("fictive");

  // « Retour » ramène à la prestation : il n'y a plus d'étape de lieu.
  await page.getByRole("button", { name: "Retour" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Quelle prestation ?" })).toBeFocused();
});

/** Réservation rapide jusqu'à l'écran de confirmation (prestation, premier créneau libre). */
async function reserverJusquALaConfirmation(page: Page) {
  await allerAuxCreneaux(page);
  const creneaux = await choisirUnJourAvecCreneaux(page);
  await creneaux.getByRole("radio").first().check();
  await continuer(page);
  await page.getByLabel("Prénom").fill("Zoé");
  await page.getByLabel("Nom", { exact: true }).fill("Durand");
  await page.getByLabel("Email").fill("zoe@example.com");
  await page.getByRole("checkbox", { name: /J'accepte/ }).check();
  await continuer(page);
  await page.getByRole("button", { name: "Confirmer la réservation" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "C'est réservé !" })).toBeVisible();
}

/**
 * Faux presse-papiers, installé avant le chargement de la page : on vérifie ce que NOTRE code
 * copie, de la même façon dans Chromium et WebKit (lire le vrai presse-papiers depuis un test
 * n'est possible que dans Chromium, avec une permission).
 */
async function simulerPressePapiers(page: Page, { refuse }: { refuse: boolean }) {
  await page.addInitScript((refuser) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (texte: string) => {
          if (refuser) throw new DOMException("refusé", "NotAllowedError");
          (window as unknown as { __copie: string }).__copie = texte;
        },
      },
    });
  }, refuse);
}

test("confirmation : « Copier le lien » copie le lien d'annulation", async ({ page }) => {
  await simulerPressePapiers(page, { refuse: false });
  await reserverJusquALaConfirmation(page);

  // Pas d'e-mail : la page invite à garder le lien ou à faire une capture d'écran.
  await expect(page.getByText(/pas d'e-mail de confirmation/)).toBeVisible();
  await expect(page.getByText(/capture d'écran/).first()).toBeVisible();

  const bouton = page.getByRole("button", { name: "Copier le lien" });
  expect((await bouton.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await bouton.click();

  await expect(page.getByRole("status").filter({ hasText: "Lien copié." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lien copié" })).toBeVisible();
  const lienAffiche = await page.locator("#cancel-link-url").textContent();
  const copie = await page.evaluate(() => (window as unknown as { __copie: string }).__copie);
  expect(copie).toMatch(/^http:\/\/localhost:5173\/annuler\?token=[0-9a-f-]{36}$/);
  expect(copie).toBe(lienAffiche?.trim());
});

test("confirmation : si la copie est refusée, la page propose de copier à la main", async ({
  page,
}) => {
  await simulerPressePapiers(page, { refuse: true });
  await reserverJusquALaConfirmation(page);

  await page.getByRole("button", { name: "Copier le lien" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Copie impossible/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copier le lien" })).toBeVisible();
});

/**
 * Bug corrigé : sur téléphone, en http://192.168.x.x:5173 (contexte NON sécurisé), les API
 * réservées à https / localhost n'existent pas. On les retire avant le chargement de la page
 * pour reproduire ce contexte dans Chromium (Android) et WebKit (iPhone).
 */
test("contexte non sécurisé (http) : prestations, réservation et repli de la copie", async ({
  page,
}) => {
  await page.addInitScript(() => {
    delete (Crypto.prototype as { randomUUID?: unknown }).randomUUID;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  });
  const erreurs: string[] = [];
  page.on("pageerror", (e) => erreurs.push(e.message));

  await page.goto("/reserver");
  expect(await page.evaluate(() => typeof crypto.randomUUID)).toBe("undefined");
  await expect(page.getByRole("radio", { name: /^Coupe\s*60 min/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Coupe \+ barbe/ })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  // Toute la réservation fonctionne, lien d'annulation compris (uuid généré par le repli).
  await reserverJusquALaConfirmation(page);
  await expect(page.locator("#cancel-link-url")).toHaveText(
    /\/annuler\?token=[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  await page.getByRole("button", { name: "Copier le lien" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Copie impossible/ })).toBeVisible();
  expect(erreurs).toEqual([]);
});
