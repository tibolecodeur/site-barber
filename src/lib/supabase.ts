import { createClient } from "@supabase/supabase-js";

// Les variables doivent commencer par `VITE_` pour que Vite les expose au navigateur.
// Seule la clé « anon » (publique) a le droit d'être ici : la clé `service_role` donnerait
// un accès total à la base et contournerait la RLS. Voir .env.example.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Variables Supabase manquantes : copie .env.example en .env.local et renseigne " +
      "VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.",
  );
}

/** Client Supabase unique, partagé par toute l'application. */
export const supabase = createClient(url, anonKey);
