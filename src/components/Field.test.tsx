import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "@/components/Field";

describe("Field", () => {
  it("relie le libellé visible au champ et transmet les attributs natifs", () => {
    render(<Field id="tel" label="Téléphone" type="tel" autoComplete="tel" />);

    const champ = screen.getByLabelText("Téléphone");
    expect(champ).toHaveAttribute("type", "tel");
    expect(champ).toHaveAttribute("autocomplete", "tel");
    expect(champ).not.toHaveAttribute("aria-invalid");
    expect(champ).not.toHaveAttribute("aria-describedby");
  });

  it("annonce l'aide et l'erreur, et marque le champ invalide", () => {
    render(
      <Field id="email" label="Email" hint="Pour le récapitulatif." error="Email invalide." />,
    );

    const champ = screen.getByLabelText("Email");
    expect(champ).toHaveAttribute("aria-invalid", "true");
    expect(champ).toHaveAccessibleDescription("Pour le récapitulatif. Email invalide.");
  });

  it("ajoute une aide partagée avant sa propre aide", () => {
    render(
      <>
        <p id="partagee">Téléphone et/ou email.</p>
        <Field id="tel" label="Téléphone" describedBy="partagee" hint="Format libre." />
      </>,
    );

    expect(screen.getByLabelText("Téléphone")).toHaveAttribute(
      "aria-describedby",
      "partagee tel-hint",
    );
  });
});
