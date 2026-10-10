import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as bookingData from "@/features/booking/data";
import { BookingPage } from "@/pages/BookingPage";

/**
 * États « chargement » et « erreur » du parcours, impossibles à provoquer en e2e contre la
 * fausse base : on remplace ici les fonctions de la couche données par des simulations.
 */
vi.mock("@/features/booking/data", async (importOriginal) => {
  const original = await importOriginal<typeof bookingData>();
  return {
    ...original,
    getServices: vi.fn(),
    getAvailableSlots: vi.fn(),
  };
});

const SERVICE = { id: "s1", name: "Coupe", durationMin: 60, priceLabel: null };

function renderPage() {
  return render(
    <MemoryRouter>
      <BookingPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(bookingData.getServices).mockReset();
  vi.mocked(bookingData.getAvailableSlots).mockReset();
});

describe("BookingPage : chargement et erreurs", () => {
  it("affiche le chargement, puis une erreur avec « Réessayer », puis les prestations", async () => {
    const user = userEvent.setup();
    vi.mocked(bookingData.getServices)
      .mockRejectedValueOnce(new Error("réseau"))
      .mockResolvedValueOnce([SERVICE]);
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Chargement des prestations…");
    expect(await screen.findByRole("alert")).toHaveTextContent(/Impossible de charger/);

    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByRole("radio", { name: /Coupe/ })).toBeInTheDocument();
  });

  it("affiche « Aucune prestation disponible » si la liste est vide, sans formulaire", async () => {
    vi.mocked(bookingData.getServices).mockResolvedValue([]);
    renderPage();

    expect(
      await screen.findByText("Aucune prestation disponible pour l'instant."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuer" })).not.toBeInTheDocument();
  });

  it("affiche une erreur de chargement des créneaux et permet de réessayer", async () => {
    const user = userEvent.setup();
    vi.mocked(bookingData.getServices).mockResolvedValue([SERVICE]);
    vi.mocked(bookingData.getAvailableSlots)
      .mockRejectedValueOnce(new Error("réseau"))
      .mockResolvedValueOnce([
        {
          startsAt: "2030-01-15T13:00:00.000Z",
          endsAt: "2030-01-15T14:00:00.000Z",
          locationId: "l1",
          locationLabel: "Saint-Christophe-du-Bois",
        },
      ]);
    renderPage();

    await user.click(await screen.findByRole("radio", { name: /Coupe/ }));
    await user.click(screen.getByRole("button", { name: "Continuer" }));
    await user.click(screen.getAllByRole("radio")[0]!);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Impossible de charger les créneaux/,
    );
    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    // Le créneau affiche le libellé public de son lieu.
    expect(
      await screen.findByRole("radio", { name: /14:00 – 15:00\s*Saint-Christophe-du-Bois/ }),
    ).toBeInTheDocument();
  });
});
