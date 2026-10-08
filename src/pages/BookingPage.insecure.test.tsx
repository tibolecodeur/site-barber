import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetFakeDb } from "@/lib/fakeDb";
import { BookingPage } from "@/pages/BookingPage";

/**
 * Bug corrigé : ouvert en http sur l'adresse du réseau local (téléphone, contexte non
 * sécurisé), `crypto.randomUUID` n'existe pas ; la fausse base plantait à sa création et
 * /reserver n'affichait qu'une erreur rouge, sans prestation. Ici, VRAIE couche données
 * (aucun mock) avec un `crypto` réduit à ce qu'offre un contexte non sécurisé.
 */
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BookingPage en contexte non sécurisé (http)", () => {
  it("affiche les prestations sans crypto.randomUUID", async () => {
    const realCrypto = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: realCrypto.getRandomValues.bind(realCrypto) });
    // Le stub ci-dessus n'a pas randomUUID : on le vérifie avant d'aller plus loin.
    expect("randomUUID" in globalThis.crypto).toBe(false);
    resetFakeDb(); // la base est recréée AVEC ce crypto réduit

    render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("radio", { name: /^Coupe\s*60 min/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^Coupe \+ barbe/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
