import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";
import { ErrorMessage } from "@/components/StatusMessage";
import { AdminError, signIn, type AdminSession } from "@/features/admin/data";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email ou mot de passe incorrect.",
  not_connected: "La connexion n'est pas encore disponible.",
};

/** Connexion à l'espace admin (email + mot de passe, compte unique). */
export function AdminLoginPage({ onSignedIn }: { onSignedIn: (session: AdminSession) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(undefined);
    try {
      onSignedIn(await signIn(email, password));
    } catch (caught) {
      setError(
        (caught instanceof AdminError && ERROR_MESSAGES[caught.code]) ||
          "Connexion impossible. Vérifie ta connexion internet, puis réessaie.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main id="contenu" tabIndex={-1} className="min-h-dvh pt-[env(safe-area-inset-top)]">
      <PageMeta title="Espace admin" description="Connexion à l'espace d'administration." />
      <Section variant="blush">
        <h1>Espace admin</h1>
      </Section>
      <Section>
        <Card className="mx-auto w-full max-w-md">
          <form
            onSubmit={handleSubmit}
            noValidate
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
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              label="Mot de passe"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button
              type="submit"
              disabled={submitting}
              aria-busy={submitting || undefined}
              className="w-full"
            >
              {submitting ? "Connexion…" : "Se connecter"}
            </Button>
            {/* Retiré du build de production : `import.meta.env.DEV` y vaut false. */}
            {import.meta.env.DEV && (
              <p className="text-sm text-muted">
                Développement : connexion factice, n'importe quel email et mot de passe.
              </p>
            )}
          </form>
        </Card>
      </Section>
    </main>
  );
}
