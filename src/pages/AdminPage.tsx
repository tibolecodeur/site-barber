import type { SubmitEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";

/** Squelette de la connexion admin : aucune logique, l'authentification viendra en phase 6. */
export function AdminPage() {
  // Bloque l'envoi natif du formulaire (rechargement avec les valeurs dans l'URL).
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <>
      <PageMeta title="Espace admin" description="Connexion à l'espace d'administration." />
      <Section variant="blush">
        <h1>Espace admin</h1>
      </Section>
      <Section>
        <Card className="mx-auto w-full max-w-md">
          <form
            onSubmit={handleSubmit}
            aria-labelledby="admin-login"
            className="flex flex-col gap-5"
          >
            <h2 id="admin-login" className="text-3xl">
              Connexion
            </h2>
            <Field
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              label="Email"
            />
            <Field
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              label="Mot de passe"
            />
            <p>
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </p>
            <p className="text-sm text-muted">
              Provisoire : la connexion n'est pas encore branchée, ce bouton ne fait rien.
            </p>
          </form>
        </Card>
      </Section>
    </>
  );
}
