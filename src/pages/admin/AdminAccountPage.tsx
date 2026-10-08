import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";
import { ErrorMessage, SuccessMessage } from "@/components/StatusMessage";
import { AdminError, changePassword, MIN_PASSWORD_LENGTH } from "@/features/admin/data";
import { useAdmin } from "@/pages/admin/useAdmin";

/** Mon compte : changer de mot de passe, se déconnecter. */
export function AdminAccountPage() {
  const { session, onSignOut } = useAdmin();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await onSignOut();
    navigate("/admin");
  }

  return (
    <>
      <PageMeta title="Mon compte" description="Mot de passe et déconnexion." />
      <Section variant="blush">
        <h1>Mon compte</h1>
        <p className="break-all">Connecté avec {session.email}</p>
      </Section>
      <Section>
        <PasswordForm email={session.email} />
      </Section>
      <Section variant="blush">
        <h2>Se déconnecter</h2>
        <p>Pense à te déconnecter sur un téléphone ou un ordinateur partagé.</p>
        <p>
          <Button
            variant="secondary"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full sm:w-auto"
          >
            Se déconnecter
          </Button>
        </p>
      </Section>
    </>
  );
}

function PasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmation?: string }>({});
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSuccess(false);
    const found: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      found.password = `${MIN_PASSWORD_LENGTH} caractères minimum.`;
    }
    if (confirmation !== password) found.confirmation = "Les deux mots de passe sont différents.";
    setErrors(found);
    if (found.password || found.confirmation) return;

    setSubmitting(true);
    try {
      await changePassword(password);
      setSuccess(true);
      setPassword("");
      setConfirmation("");
    } catch (caught) {
      setError(
        caught instanceof AdminError && caught.code === "weak_password"
          ? "Mot de passe trop faible : choisis-en un plus long."
          : "Le mot de passe n'a pas pu être changé. Vérifie ta connexion, puis réessaie.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="change-password"
      className="flex flex-col gap-5"
    >
      <h2 id="change-password">Changer mon mot de passe</h2>
      {/* Identifiant invisible : aide le gestionnaire de mots de passe à enregistrer le nouveau
          mot de passe pour le bon compte. */}
      <input type="hidden" name="username" autoComplete="username" value={email} readOnly />
      <Field
        id="new-password"
        name="new-password"
        type="password"
        autoComplete="new-password"
        label="Nouveau mot de passe"
        hint={`${MIN_PASSWORD_LENGTH} caractères minimum.`}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <Field
        id="confirm-password"
        name="confirm-password"
        type="password"
        autoComplete="new-password"
        label="Confirme le nouveau mot de passe"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        error={errors.confirmation}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Mot de passe modifié.</SuccessMessage>}
      <Button
        type="submit"
        disabled={submitting}
        aria-busy={submitting || undefined}
        className="w-full sm:w-auto"
      >
        {submitting ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
