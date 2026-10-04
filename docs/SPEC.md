# Cahier des charges — site barber

> Brouillon. Sera complété pendant la phase 0 (interview avec Claude). Les points « À confirmer »
> sont à valider avec le barber.

## Objectif
Permettre aux clients de réserver un créneau en ligne en moins d'une minute depuis leur téléphone,
et au barber (étudiant, disponibilités variables) de publier lui-même ses créneaux et ses créations.

## Utilisateurs
- **Client** : sans compte. Veut voir les créneaux libres, réserver vite, pouvoir annuler.
- **Barber (admin)** : un seul compte. Gère ses dispos, voit ses RDV, publie des photos. Surtout sur mobile.

## Fonctionnalités — V1 (MVP)
### Public
- Accueil : présentation, photo, CTA « Réserver », adresse / zone, contact (Instagram, téléphone).
- Prestations et tarifs (affichage). Paiement **sur place, en liquide**.
- Galerie des créations (photos + légende courte).
- Réservation : prestation → jour (calendrier) → créneau libre → prénom, nom, téléphone et/ou email
  → consentement RGPD → confirmation.
- Page de confirmation : récap, lien d'annulation personnel, bouton « Ajouter à mon calendrier » (.ics).
- Annulation via le lien personnel (`/annuler?token=…`), possible jusqu'à X h avant le RDV (À confirmer).
- Pages : mentions légales, politique de confidentialité.

### Admin (`/admin`, connexion email + mot de passe)
- Ajouter / modifier / supprimer des plages de disponibilité (ex. mardi 14h–18h). Duplication rapide
  d'une semaine sur l'autre.
- Liste des RDV à venir (jour / semaine), détail client, annulation par le barber.
- Galerie : ajout de photo depuis le téléphone, légende, ordre, publier / masquer.
- Prestations : nom, durée, prix affiché, actif / inactif.

## V2 (plus tard)
- Emails de confirmation / rappel / annulation (Resend) — nécessite un nom de domaine vérifié.
- Admin installable sur l'écran d'accueil (PWA) + notification à chaque nouvelle réservation.
- Captcha Cloudflare Turnstile si spam. SEO local (prérendu des pages vitrine, données structurées).

## Données
- `services` : id, name, duration_min, price_label, active, sort_order
- `availabilities` : id, starts_at, ends_at (timestamptz)
- `bookings` : id, service_id, starts_at, ends_at, first_name, last_name, phone, email,
  status (`confirmed` | `cancelled`), cancel_token (uuid), created_at
  → contrainte d'exclusion : pas de chevauchement entre réservations `confirmed`
- `gallery_items` : id, image_path, caption, sort_order, published, created_at
- `admins` : user_id (référence auth.users)

## Règles de gestion
- Créneaux proposés = disponibilités découpées selon la durée de la prestation, moins les RDV
  confirmés, moins les créneaux déjà passés (+ délai minimum de réservation, À confirmer : 2 h ?).
- Pas de réservation au-delà de N semaines (À confirmer : 4 ?).
- Limite anti-abus : 2 RDV futurs max par téléphone/email.
- Conservation des données clients : suppression X mois après le RDV (À confirmer : 6 mois).

## À confirmer avec le barber
- [ ] Prestations proposées, durées, prix affichés (« coupe » par défaut, adapté sur place ?)
- [ ] Durée standard d'un créneau (30 min ? 45 min ?)
- [ ] Où il coupe (chez lui, se déplace ?) → ce qu'on affiche comme adresse
- [ ] Délai d'annulation client
- [ ] Nom, logo, couleurs, ambiance, photos disponibles
- [ ] Réseaux sociaux à mettre en avant

## Contraintes
- Coût : 0 € (offres gratuites) hors nom de domaine éventuel.
- Mobile d'abord, chargement rapide, accessible.
- RGPD : données minimales, consentement, droit de suppression, mentions légales.
