import { fakeDb, fakeLatency, type GalleryItemRow } from "@/lib/fakeDb";
import { randomUuid } from "@/lib/uuid";

/**
 * Couche données de la galerie : les écrans n'importent QUE ces fonctions.
 * Table `gallery_items` + bucket Storage « gallery » (5 Mo max, jpeg / png / webp).
 *
 * TODO: brancher Supabase. Implémentation factice : aucune photo n'est envoyée, l'aperçu
 * reste dans le navigateur (URL blob:) jusqu'au rechargement de la page.
 */

export type GalleryItem = {
  id: string;
  /** URL de l'image ; null pour les créations de démonstration sans fichier. */
  imageUrl: string | null;
  caption: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
};

export type NewGalleryItem = {
  file: File;
  caption: string;
};

export type GalleryErrorCode = "invalid_file" | "file_too_large" | "caption_too_long" | "not_found";

export class GalleryError extends Error {
  readonly code: GalleryErrorCode;

  constructor(code: GalleryErrorCode) {
    super(code);
    this.name = "GalleryError";
    this.code = code;
  }
}

/** Limites du bucket et de la table (supabase/migrations). */
export const GALLERY_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxCaptionLength: 200,
} as const;

function toItem(row: GalleryItemRow): GalleryItem {
  return {
    id: row.id,
    // TODO: brancher Supabase : supabase.storage.from("gallery").getPublicUrl(row.image_path).
    imageUrl: fakeDb().galleryPreviews.get(row.image_path) ?? null,
    caption: row.caption,
    sortOrder: row.sort_order,
    published: row.published,
    createdAt: row.created_at,
  };
}

/** Photos dans l'ordre d'affichage ; seulement les publiées, sauf pour l'admin. */
export async function getGalleryItems(
  options: { includeHidden?: boolean } = {},
): Promise<GalleryItem[]> {
  await fakeLatency();
  return fakeDb()
    .gallery_items.filter((row) => options.includeHidden || row.published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(toItem);
}

/** Ajoute une photo, publiée et placée en dernier. */
export async function addGalleryItem(input: NewGalleryItem): Promise<GalleryItem> {
  await fakeLatency();
  if (!(GALLERY_LIMITS.acceptedTypes as readonly string[]).includes(input.file.type)) {
    throw new GalleryError("invalid_file");
  }
  if (input.file.size > GALLERY_LIMITS.maxFileBytes) throw new GalleryError("file_too_large");
  const caption = input.caption.trim();
  if (caption.length > GALLERY_LIMITS.maxCaptionLength) throw new GalleryError("caption_too_long");

  const db = fakeDb();
  const id = randomUuid();
  const row: GalleryItemRow = {
    id,
    image_path: `${id}.${input.file.type.split("/")[1]}`,
    caption: caption === "" ? null : caption,
    sort_order: Math.max(0, ...db.gallery_items.map((r) => r.sort_order)) + 1,
    published: true,
    created_at: new Date().toISOString(),
  };
  db.gallery_items.push(row);
  // Aperçu local, sans envoi : l'image reste dans la mémoire du navigateur.
  if (typeof URL.createObjectURL === "function") {
    db.galleryPreviews.set(row.image_path, URL.createObjectURL(input.file));
  }
  return toItem(row);
}

/** Supprime la photo (la ligne, puis le fichier du bucket au branchement). */
export async function deleteGalleryItem(id: string): Promise<void> {
  await fakeLatency();
  const db = fakeDb();
  const row = db.gallery_items.find((r) => r.id === id);
  if (!row) throw new GalleryError("not_found");
  const preview = db.galleryPreviews.get(row.image_path);
  if (preview) {
    URL.revokeObjectURL(preview);
    db.galleryPreviews.delete(row.image_path);
  }
  db.gallery_items = db.gallery_items.filter((r) => r.id !== id);
}
