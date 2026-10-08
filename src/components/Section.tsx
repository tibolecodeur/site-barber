import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

export type SectionVariant = "white" | "blush" | "ink";

/**
 * Couleurs de chaque fond, conformes au tableau de contrastes de docs/DESIGN.md.
 * Les variables CSS règlent les liens (utilitaire `link`) et l'anneau de focus du contexte.
 */
const VARIANT_CLASS: Record<SectionVariant, string> = {
  white: "bg-surface text-ink",
  // Rose foncé sur rose pâle : 4,56, AA de justesse, d'où les liens en gras.
  blush: "bg-blush text-ink [--link-weight:700]",
  // Bloc noir : texte blanc, liens rose pâle soulignés, focus blanc. Ni gris ni rose foncé.
  ink: "bg-ink text-white [--focus-ring:var(--color-white)] [--link-color:var(--color-blush)]",
};

type SectionProps = ComponentProps<"section"> & { variant?: SectionVariant };

/** Bande pleine largeur au fond coloré ; le contenu est centré et borné en largeur. */
export function Section({ variant = "white", className, children, ...props }: SectionProps) {
  return (
    <section
      className={cx("py-section md:py-section-lg", VARIANT_CLASS[variant], className)}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-safe">{children}</div>
    </section>
  );
}
