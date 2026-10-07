import { Link } from "react-router";
import { PageMeta } from "@/components/PageMeta";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { PROVISIONAL_SERVICES } from "@/features/booking/provisionalServices";

/** Nombre d'emplacements de la galerie, en attendant les vraies photos. */
const GALLERY_SLOTS = 6;

const SECTION_CLASS = "flex flex-col gap-4 py-6";
const BUTTON_CLASS = "inline-flex min-h-11 items-center border px-4";

/** Accueil : une seule longue page, chaque section a une ancre (#prestations, #galerie…). */
export function HomePage() {
  return (
    <>
      <PageMeta description="CutsByAlix, barber : coupe et coupe + barbe sur rendez-vous. Réservez votre créneau en ligne, paiement sur place." />

      <section id="accueil" aria-labelledby="accueil-titre" className={SECTION_CLASS}>
        <h1 id="accueil-titre">CutsByAlix</h1>
        <p>Accroche provisoire : coupes et barbes soignées, sur rendez-vous.</p>
        <p>
          <Link to="/reserver" className={BUTTON_CLASS}>
            Réserver
          </Link>
        </p>
        {/* Hero : visible dès l'arrivée, la future image ne sera PAS en loading="lazy". */}
        <figure className="w-full max-w-md">
          <PhotoPlaceholder alt="Photo du barber (provisoire)" width={1200} height={1500} />
        </figure>
      </section>

      <section id="prestations" aria-labelledby="prestations-titre" className={SECTION_CLASS}>
        <h2 id="prestations-titre">Prestations</h2>
        <ul className="flex flex-col gap-4">
          {PROVISIONAL_SERVICES.map((service) => (
            <li key={service.id}>
              <h3>{service.name}</h3>
              <p>Durée : {service.durationMin} min</p>
              <p>Prix : {service.priceLabel}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="galerie" aria-labelledby="galerie-titre" className={SECTION_CLASS}>
        <h2 id="galerie-titre">Galerie</h2>
        <p>Photos bientôt disponibles.</p>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: GALLERY_SLOTS }, (_, index) => (
            // L'index suffit comme `key` : liste fixe, jamais réordonnée.
            <li key={index}>
              <figure>
                <PhotoPlaceholder
                  alt={`Création n° ${index + 1} (provisoire)`}
                  width={800}
                  height={800}
                />
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <section id="reserver" aria-labelledby="reserver-titre" className={SECTION_CLASS}>
        <h2 id="reserver-titre">Comment réserver</h2>
        <ol className="flex list-inside list-decimal flex-col gap-1">
          <li>Choisissez une prestation.</li>
          <li>Choisissez un jour.</li>
          <li>Choisissez un créneau libre.</li>
        </ol>
        <p>Paiement en liquide, sur place.</p>
        <p>Le lieu exact vous est communiqué au moment de la réservation.</p>
        <p>
          <Link to="/reserver" className={BUTTON_CLASS}>
            Réserver
          </Link>
        </p>
      </section>
    </>
  );
}
