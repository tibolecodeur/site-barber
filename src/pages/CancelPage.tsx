import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";

export function CancelPage() {
  return (
    <>
      <PageMeta
        title="Annuler ma réservation"
        description="Annulez votre rendez-vous CutsByAlix grâce au lien personnel reçu lors de la réservation."
      />
      <Section variant="blush">
        <h1>Annuler ma réservation</h1>
      </Section>
      <Section>
        <div className="flex flex-col gap-4">
          <p>
            Pour annuler, ouvrez le lien personnel affiché au moment de votre réservation : il
            contient un code unique qui identifie votre rendez-vous.
          </p>
          <p>Cette page affichera alors votre rendez-vous et un bouton pour l'annuler.</p>
          <p className="text-muted">Délai d'annulation avant le rendez-vous : À confirmer.</p>
        </div>
      </Section>
    </>
  );
}
