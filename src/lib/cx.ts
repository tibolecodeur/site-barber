/**
 * Assemble des classes CSS en ignorant les valeurs vides : `cx("a", cond && "b", undefined)`.
 * Équivalent minimal de la librairie `clsx`, sans dépendance. Ne résout PAS les conflits
 * Tailwind (`px-2` puis `px-4`) : les composants évitent d'en créer.
 */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
