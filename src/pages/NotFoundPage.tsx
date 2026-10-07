import { Link } from "react-router";
import { PageMeta } from "@/components/PageMeta";

export function NotFoundPage() {
  return (
    <>
      <PageMeta title="Page introuvable" description="Cette page n'existe pas." />
      <h1>Page introuvable</h1>
      <p className="py-4">
        <Link to="/" className="inline-flex min-h-11 items-center">
          Retour à l'accueil
        </Link>
      </p>
    </>
  );
}
