/**
 * Faux état connecté, pour développer les écrans admin SANS Supabase.
 *
 * Il n'existe QU'EN DÉVELOPPEMENT. Vite remplace `import.meta.env.DEV` par la constante
 * `false` dans le build de production ; chaque `if (!import.meta.env.DEV) return …` devient
 * alors inconditionnel, et le code qui suit est supprimé du fichier JavaScript livré
 * (élimination du code mort). Le test devSession.build.test.ts le vérifie sur un vrai build.
 *
 * La « session » vit dans sessionStorage : elle disparaît à la fermeture de l'onglet.
 * TODO: brancher Supabase. Ce fichier disparaîtra avec la vraie authentification.
 */

/** Marqueur unique, recherché par le test de build : il ne doit pas y figurer. */
const STORAGE_KEY = "cutsbyalix:dev-admin-session";

/** Vrai si le faux état connecté est utilisable (serveur de développement uniquement). */
export function isDevSessionEnabled(): boolean {
  return import.meta.env.DEV === true;
}

/** Email de la fausse session, ou null (toujours null hors développement). */
export function readDevSession(): string | null {
  if (!import.meta.env.DEV) return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // Navigation privée stricte : stockage refusé, on reste déconnecté.
    return null;
  }
}

/** Ouvre la fausse session. Lève une erreur hors développement. */
export function writeDevSession(email: string): void {
  if (!import.meta.env.DEV) throw new Error("Faux état connecté indisponible en production.");
  sessionStorage.setItem(STORAGE_KEY, email);
}

export function clearDevSession(): void {
  if (!import.meta.env.DEV) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Rien à effacer si le stockage est refusé.
  }
}
