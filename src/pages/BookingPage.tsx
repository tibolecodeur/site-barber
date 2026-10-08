import { useState } from "react";
import { PageMeta } from "@/components/PageMeta";
import { Section } from "@/components/Section";
import type { AvailableSlot, BookingReceipt } from "@/features/booking/data";
import type { ContactForm } from "@/features/booking/validation";
import type { DayKey } from "@/lib/dates";
import { ConfirmationStep } from "@/pages/booking/ConfirmationStep";
import { ContactStep } from "@/pages/booking/ContactStep";
import { LocationStep } from "@/pages/booking/LocationStep";
import { ServiceStep } from "@/pages/booking/ServiceStep";
import { SlotStep } from "@/pages/booking/SlotStep";
import { SummaryStep } from "@/pages/booking/SummaryStep";

type Step = "service" | "location" | "slot" | "contact" | "summary" | "done";

const EMPTY_CONTACT: ContactForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  consent: false,
};

/**
 * Parcours de réservation en étapes : prestation → lieu → jour et créneau → coordonnées →
 * récapitulatif → confirmation.
 *
 * Tout l'état du parcours vit ICI, dans le parent (« remonter l'état ») : chaque étape
 * reçoit ses valeurs en props et signale les changements par des fonctions `on…`. Revenir
 * en arrière ne perd donc rien : l'étape démontée n'emporte pas les données avec elle.
 * C'est l'équivalent d'un objet en session côté Symfony, mais en mémoire dans la page.
 */
export function BookingPage() {
  const [step, setStep] = useState<Step>("service");
  // Faux au premier affichage : le focus reste en haut de page (titre h1), comme partout.
  const [hasNavigated, setHasNavigated] = useState(false);
  const [service, setService] = useState<{ id: string; name: string } | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [day, setDay] = useState<DayKey | null>(null);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactForm>(EMPTY_CONTACT);
  const [website, setWebsite] = useState("");
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);

  function goTo(next: Step) {
    setStep(next);
    setHasNavigated(true);
    if (next !== "slot") setSlotNotice(null);
  }

  // Un créneau choisi n'est valable que pour la prestation et le lieu de ce moment-là.
  function changeService(id: string, name: string) {
    if (service?.id !== id) setSlot(null);
    setService({ id, name });
  }

  function changeLocation(next: string | null) {
    if (slot && next !== null && slot.locationLabel !== next) setSlot(null);
    setLocation(next);
  }

  function changeDay(next: DayKey) {
    setDay(next);
    setSlot(null);
    setSlotNotice(null);
  }

  function renderStep() {
    if (step === "service" || service === null) {
      return (
        <ServiceStep
          serviceId={service?.id ?? null}
          focusOnMount={hasNavigated}
          onChange={changeService}
          onNext={() => goTo("location")}
        />
      );
    }
    if (step === "location") {
      return (
        <LocationStep
          location={location}
          focusOnMount={hasNavigated}
          onChange={changeLocation}
          onBack={() => goTo("service")}
          onNext={() => goTo("slot")}
        />
      );
    }
    if (step === "slot" || slot === null) {
      return (
        <SlotStep
          serviceId={service.id}
          location={location}
          day={day}
          slot={slot}
          notice={slotNotice}
          focusOnMount={hasNavigated}
          onDayChange={changeDay}
          onSlotChange={setSlot}
          onBack={() => goTo("location")}
          onNext={() => goTo("contact")}
        />
      );
    }
    if (step === "contact") {
      return (
        <ContactStep
          contact={contact}
          website={website}
          focusOnMount={hasNavigated}
          onChange={setContact}
          onWebsiteChange={setWebsite}
          onBack={() => goTo("slot")}
          onNext={() => goTo("summary")}
        />
      );
    }
    if (step === "summary" || receipt === null) {
      return (
        <SummaryStep
          serviceId={service.id}
          serviceName={service.name}
          slot={slot}
          contact={contact}
          website={website}
          focusOnMount={hasNavigated}
          onBack={() => goTo("contact")}
          onSlotLost={(message) => {
            setSlot(null);
            goTo("slot");
            setSlotNotice(message);
          }}
          onBooked={(done) => {
            setReceipt(done);
            goTo("done");
          }}
        />
      );
    }
    return <ConfirmationStep receipt={receipt} focusOnMount={hasNavigated} />;
  }

  return (
    <>
      <PageMeta
        title="Réserver"
        description="Réserve ton créneau chez CutsByAlix en une minute : prestation, jour, créneau libre. Paiement sur place."
      />
      <Section variant="blush">
        <h1>Réserver</h1>
        <p className="text-lg">Réserve ta coupe en une minute.</p>
      </Section>
      <Section>
        {/* `key` : un cadre neuf à chaque étape (voir StepFrame, gestion du focus). */}
        <div key={step} className="w-full">
          {renderStep()}
        </div>
      </Section>
    </>
  );
}
