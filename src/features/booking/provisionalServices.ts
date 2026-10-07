/**
 * Prestations PROVISOIRES, affichées tant que le site n'est pas branché à la base.
 * À remplacer par la lecture de la table `services` (Supabase) : ce fichier disparaîtra alors.
 * Seul endroit où ces valeurs sont écrites : l'accueil et /reserver les lisent ici.
 */
export type ProvisionalService = {
  id: string;
  name: string;
  durationMin: number;
  priceLabel: string;
};

export const PROVISIONAL_SERVICES: readonly ProvisionalService[] = [
  { id: "coupe", name: "Coupe", durationMin: 60, priceLabel: "À confirmer" },
  { id: "coupe-barbe", name: "Coupe + barbe", durationMin: 60, priceLabel: "À confirmer" },
];
