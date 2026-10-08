import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addGalleryItem,
  deleteGalleryItem,
  GalleryError,
  getGalleryItems,
} from "@/features/gallery/data";
import { fakeDb, resetFakeDb } from "@/lib/fakeDb";

function photo(type = "image/jpeg", size = 1000): File {
  const file = new File(["x"], "photo.jpg", { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

beforeEach(() => {
  resetFakeDb();
  // jsdom n'implémente pas les URL blob: : on les simule.
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:apercu"), revokeObjectURL: vi.fn() }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function expectGalleryError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(GalleryError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe("galerie", () => {
  it("liste les photos publiées dans l'ordre, et les masquées pour l'admin", async () => {
    fakeDb().gallery_items[0]!.published = false;
    const published = await getGalleryItems();
    const all = await getGalleryItems({ includeHidden: true });

    expect(published).toHaveLength(2);
    expect(all).toHaveLength(3);
    expect(all.map((item) => item.sortOrder)).toEqual([1, 2, 3]);
    expect(all[0]).toMatchObject({ imageUrl: null, caption: "Création de démonstration n° 1" });
  });

  it("ajoute une photo en dernier, avec un aperçu local, sans légende vide", async () => {
    const item = await addGalleryItem({ file: photo(), caption: "  " });
    expect(item).toMatchObject({
      imageUrl: "blob:apercu",
      caption: null,
      sortOrder: 4,
      published: true,
    });
    expect(await getGalleryItems()).toHaveLength(4);
  });

  it("refuse un fichier qui n'est pas une image acceptée, trop lourd, ou une légende trop longue", async () => {
    await expectGalleryError(
      addGalleryItem({ file: photo("image/gif"), caption: "" }),
      "invalid_file",
    );
    await expectGalleryError(
      addGalleryItem({ file: photo("image/png", 6 * 1024 * 1024), caption: "" }),
      "file_too_large",
    );
    await expectGalleryError(
      addGalleryItem({ file: photo(), caption: "x".repeat(201) }),
      "caption_too_long",
    );
  });

  it("supprime une photo et libère son aperçu", async () => {
    const item = await addGalleryItem({ file: photo("image/webp"), caption: "Dégradé" });
    await deleteGalleryItem(item.id);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:apercu");
    expect((await getGalleryItems()).some((i) => i.id === item.id)).toBe(false);
    await expectGalleryError(deleteGalleryItem(item.id), "not_found");
  });
});
