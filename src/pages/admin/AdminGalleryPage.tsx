import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageMeta } from "@/components/PageMeta";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { Section } from "@/components/Section";
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
  SuccessMessage,
} from "@/components/StatusMessage";
import {
  addGalleryItem,
  deleteGalleryItem,
  GALLERY_LIMITS,
  GalleryError,
  getGalleryItems,
  type GalleryItem,
} from "@/features/gallery/data";
import { useAsync } from "@/lib/useAsync";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_file: "Formats acceptés : JPEG, PNG ou WebP.",
  file_too_large: "Photo trop lourde : 5 Mo maximum.",
  caption_too_long: `Légende trop longue : ${GALLERY_LIMITS.maxCaptionLength} caractères maximum.`,
  not_found: "Cette photo n'existe plus. Recharge la page.",
};

function errorMessage(caught: unknown): string {
  return (
    (caught instanceof GalleryError && ERROR_MESSAGES[caught.code]) ||
    "L'action n'a pas pu être enregistrée. Vérifie ta connexion, puis réessaie."
  );
}

/** Galerie : ajout d'une photo depuis le téléphone (sans envoi réel pour l'instant) et suppression. */
export function AdminGalleryPage() {
  const items = useAsync("gallery-admin", () => getGalleryItems({ includeHidden: true }));

  return (
    <>
      <PageMeta title="Galerie" description="Gestion des photos de la galerie." />
      <Section variant="blush">
        <h1>Galerie</h1>
      </Section>
      <Section>
        <AddPhotoForm onAdded={items.reload} />
      </Section>
      <Section variant="blush">
        <h2>Photos</h2>
        {items.status === "loading" && <LoadingMessage>Chargement des photos…</LoadingMessage>}
        {items.status === "error" && (
          <ErrorMessage onRetry={items.reload}>Impossible de charger les photos.</ErrorMessage>
        )}
        {items.status === "success" &&
          (items.data.length === 0 ? (
            <EmptyMessage>
              <p>Aucune photo pour l'instant.</p>
            </EmptyMessage>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.data.map((item) => (
                <PhotoItem key={item.id} item={item} onDeleted={items.reload} />
              ))}
            </ul>
          ))}
      </Section>
    </>
  );
}

function AddPhotoForm({ onAdded }: { onAdded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string>();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(undefined);
    setSuccess(undefined);
    if (file === null) {
      setFileError("Choisis une photo.");
      return;
    }
    setSubmitting(true);
    try {
      await addGalleryItem({ file, caption });
      setSuccess("Photo ajoutée à la galerie.");
      setFile(null);
      setCaption("");
      // Le champ fichier ne se vide pas via React (il est « non contrôlé ») : on remet le
      // formulaire à zéro à la main.
      form.reset();
      onAdded();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="add-photo"
      className="flex flex-col gap-5"
    >
      <h2 id="add-photo">Ajouter une photo</h2>
      <Field
        id="photo-file"
        name="photo"
        type="file"
        accept={GALLERY_LIMITS.acceptedTypes.join(",")}
        label="Photo"
        hint="JPEG, PNG ou WebP, 5 Mo maximum. Depuis ta galerie ou ton appareil photo."
        error={fileError}
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setFileError(undefined);
        }}
      />
      <Field
        id="photo-caption"
        name="caption"
        type="text"
        label="Légende (facultative)"
        maxLength={GALLERY_LIMITS.maxCaptionLength}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <p className="text-sm text-muted">
        Provisoire : la photo n'est pas encore envoyée, elle disparaît au rechargement de la page.
      </p>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      <Button
        type="submit"
        disabled={submitting}
        aria-busy={submitting || undefined}
        className="w-full sm:w-auto"
      >
        {submitting ? "Ajout en cours…" : "Ajouter la photo"}
      </Button>
    </form>
  );
}

function PhotoItem({ item, onDeleted }: { item: GalleryItem; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const alt = item.caption ?? "Création sans légende";

  async function handleDelete() {
    setDeleting(true);
    setError(undefined);
    try {
      await deleteGalleryItem(item.id);
      onDeleted();
    } catch (caught) {
      setError(errorMessage(caught));
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <Card as="li">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={alt}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      ) : (
        <PhotoPlaceholder alt={alt} width={800} height={800} />
      )}
      <p>{item.caption ?? <span className="text-muted">Sans légende</span>}</p>
      {!item.published && <p className="text-sm font-semibold">Masquée</p>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {confirming ? (
        <div className="flex flex-col gap-3">
          <Button variant="secondary" onClick={() => setConfirming(false)} disabled={deleting}>
            Garder
          </Button>
          <Button onClick={handleDelete} disabled={deleting} aria-busy={deleting || undefined}>
            {deleting ? "Suppression…" : "Oui, supprimer"}
          </Button>
        </div>
      ) : (
        <p>
          <Button
            variant="secondary"
            onClick={() => setConfirming(true)}
            aria-label={`Supprimer la photo « ${alt} »`}
          >
            Supprimer
          </Button>
        </p>
      )}
    </Card>
  );
}
