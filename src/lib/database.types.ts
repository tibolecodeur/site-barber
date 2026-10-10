/**
 * Types de la base, écrits À LA MAIN d'après supabase/migrations (pas de `supabase gen types`,
 * qui demanderait une connexion de la CLI au projet). Même forme que le fichier généré, pour
 * pouvoir le remplacer plus tard sans toucher au reste.
 *
 * À mettre à jour à chaque migration qui touche une table listée ici. Seules les tables
 * réellement lues par le front y figurent (pour l'instant : `services`).
 */

/** Table `public.services` (migration …_tables.sql). */
type ServicesTable = {
  Row: {
    id: string;
    /** 1 à 80 caractères, sans espace au début ni à la fin. */
    name: string;
    /** Entre 15 et 240, multiple de 5. */
    duration_min: number;
    /** Prix affiché tel quel, 40 caractères max ; null tant qu'il n'est pas fixé. */
    price_label: string | null;
    active: boolean;
    sort_order: number;
    /** timestamptz, renvoyé en ISO 8601. */
    created_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    duration_min: number;
    price_label?: string | null;
    active?: boolean;
    sort_order?: number;
    created_at?: string;
  };
  Update: Partial<ServicesTable["Insert"]>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      services: ServicesTable;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
