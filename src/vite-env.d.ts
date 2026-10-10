/// <reference types="vite/client" />

/**
 * Variables d'environnement lues par le front (`import.meta.env`). Seules celles qui
 * commencent par `VITE_` sont exposées au navigateur, donc PUBLIQUES une fois le site construit.
 * Optionnelles : le site doit afficher un message d'erreur, pas planter, si elles manquent.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** Clé publique « anon » uniquement, jamais la clé `service_role`. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
