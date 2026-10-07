import type { SubmitEvent } from "react";
import { PageMeta } from "@/components/PageMeta";

const FIELD_CLASS = "flex flex-col gap-1";

/** Squelette de la connexion admin : aucune logique, l'authentification viendra en phase 6. */
export function AdminPage() {
  // Bloque l'envoi natif du formulaire (rechargement avec les valeurs dans l'URL).
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <>
      <PageMeta title="Espace admin" description="Connexion à l'espace d'administration." />
      <h1>Espace admin</h1>
      <form
        onSubmit={handleSubmit}
        aria-labelledby="admin-login"
        className="flex flex-col gap-4 py-4"
      >
        <h2 id="admin-login">Connexion</h2>
        <div className={FIELD_CLASS}>
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" name="email" type="email" autoComplete="username" />
        </div>
        <div className={FIELD_CLASS}>
          <label htmlFor="admin-password">Mot de passe</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
          />
        </div>
        <p>
          <button type="submit" className="min-h-11 border px-4">
            Se connecter
          </button>
        </p>
        <p>Provisoire : la connexion n'est pas encore branchée, ce bouton ne fait rien.</p>
      </form>
    </>
  );
}
