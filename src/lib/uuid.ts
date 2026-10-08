/**
 * Identifiant aléatoire au format uuid v4, pour la fausse base de données.
 *
 * `crypto.randomUUID()` n'existe que dans un contexte sécurisé (https ou localhost) : ouvert
 * en http sur l'adresse du réseau local (http://192.168.x.x:5173, test sur téléphone), il est
 * absent et son appel plante. `crypto.getRandomValues()`, lui, existe partout : on construit
 * le même format à partir de 16 octets aléatoires.
 *
 * TODO: brancher Supabase. En production, les identifiants et le cancel_token sont générés
 * par la base (gen_random_uuid), pas par le navigateur.
 */
export function randomUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Dernier recours (navigateur très ancien) : suffisant pour des données factices.
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // Version 4 (aléatoire) et variante RFC 4122, comme randomUUID.
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
