import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { BookingPage } from "@/pages/BookingPage";

/**
 * Site lancé SANS variables Supabase (CI, clone neuf sans .env.local) : vraie couche données,
 * vrai client, aucun mock. vite.config.ts force les variables à vide pour tous les tests.
 * Attendu : un message lisible à la place des prestations, et la page reste debout.
 */
describe("Prestations sans configuration Supabase", () => {
  it("affiche « Impossible de charger les prestations pour le moment » sans casser la page", async () => {
    render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de charger les prestations pour le moment",
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Quelle prestation ?" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
  });
});
