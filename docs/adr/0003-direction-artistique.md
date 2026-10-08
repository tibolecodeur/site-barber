# ADR 0003 — Direction artistique : mélange B « Plein jour » + C « Duotone »

- **Date** : 2026-10-08
- **Statut** : accepté

## Contexte

Phase 3 (identité visuelle). Entrées : les intentions de `docs/DESIGN.md` (nom CutsByAlix,
logo en capitales grasses, condensées et inclinées sur photo noir et blanc, rose et orange
dominants avec gris et blanc, ton professionnel), le logo actuel (`docs/inspiration/`, non
versionné) et la référence noclout.fr pour l'accueil (hero vidéo plein écran, marque au centre,
menu par-dessus, streetwear minimal).

Contraintes : ~90 % de visiteurs sur mobile, réseau 4G, contrastes AA, coût 0 €, RGPD, aucune
librairie d'animation sans validation. Trois directions ont été proposées avec `/direction-artistique`,
sans démo codée.

## Décision

Mélange de **B « Plein jour »** (base) et de **C « Duotone »** (accents) :

- **Base B** : fond blanc, structure propre, ton « salon » rassurant et professionnel, police
  **Archivo** (titres très condensés, extra-gras, italiques ; texte en largeur normale).
- **Apports de C** : sections alternées blanc / rose pâle `#FFD9E6` avec quelques blocs noirs
  `#111111`, boutons pilule, vidéo du hero noir et blanc teintée rose → orange (duotone CSS
  fixe), galerie en noir et blanc qui passe en couleur dans la vue détail.
- **Couleurs** : texte `#111111`, secondaire `#5C5C5C`, action principale `#FF6A1A` avec texte
  `#111111`, liens et accents `#C2185B` (en gras sur le rose pâle) ; sur les blocs noirs,
  texte `#FFFFFF` et accents `#FFD9E6` (liens soulignés). Jamais de texte orange sur fond clair.
- **Polices auto-hébergées** : Archivo via `@fontsource-variable/archivo`, servie par notre
  domaine. Aucune police chargée depuis un CDN externe (règle ajoutée à `CLAUDE.md`).

Détail des valeurs : `docs/DESIGN.md`, seule source de vérité du design.

## Alternatives étudiées

- **A « Nuit »** (fond noir `#0D0D0D`, rose `#FF4F9A` et orange `#FF7A1A`, Barlow Condensed +
  Barlow)
  - _Pour_ : la plus proche du logo noir et blanc et de noclout ; rose et orange ressortent
    fortement sur le noir.
  - _Contre_ : ambiance plus « rue » que « salon » ; un site entièrement sombre rassure moins
    pour une première réservation chez un barber étudiant. Écartée.
- **C « Duotone » seule** (fond rose pâle partout, Anton + Work Sans, ton plus joueur)
  - _Pour_ : le rose domine franchement, identité très reconnaissable.
  - _Contre_ : rose partout fatigant sur de longues pages (réservation, admin) ; deux familles
    de polices à charger ; ton moins professionnel. Écartée en tant que telle, mais ses
    meilleurs éléments sont repris (alternance, pilules, duotone, galerie N&B).
- **B « Plein jour » seule** (blanc et gris clair, boutons à coins de 4 px)
  - _Pour_ : très lisible, sobre.
  - _Contre_ : trop proche d'un site générique ; le rose reste en retrait alors qu'il fait
    partie des couleurs dominantes souhaitées.
- **Polices depuis Google Fonts (CDN)**
  - _Pour_ : aucune installation, cache partagé supposé.
  - _Contre_ : l'adresse IP du visiteur part chez Google sans consentement (jugé contraire au
    RGPD, LG München, 2022) ; le cache partagé entre sites n'existe plus dans les navigateurs
    récents. Écartée.

## Contrastes (WCAG 2.1, AA = 4,5 texte normal)

| Texte / fond          | Ratio | Verdict                                  |
| --------------------- | ----- | ---------------------------------------- |
| `#111111` / `#FFFFFF` | 18,88 | AA                                       |
| `#111111` / `#FFD9E6` | 14,67 | AA                                       |
| `#5C5C5C` / `#FFFFFF` | 6,69  | AA                                       |
| `#5C5C5C` / `#FFD9E6` | 5,20  | AA                                       |
| `#111111` / `#FF6A1A` | 6,59  | AA (texte des boutons)                   |
| `#C2185B` / `#FFFFFF` | 5,87  | AA                                       |
| `#C2185B` / `#FFD9E6` | 4,56  | AA de justesse, d'où le gras             |
| `#FFFFFF` / `#111111` | 18,88 | AA                                       |
| `#FFD9E6` / `#111111` | 14,67 | AA                                       |
| `#C2185B` / `#111111` | 3,22  | échec : interdit sur bloc noir           |
| `#5C5C5C` / `#111111` | 2,82  | échec : interdit sur bloc noir           |
| `#FF6A1A` / `#FFFFFF` | 2,87  | échec : jamais de texte orange sur clair |

## Conséquences

**Positif**

- Une seule famille de police variable : peu de fichiers à charger, bon pour la 4G.
- Toutes les combinaisons de texte autorisées passent l'AA, et les combinaisons interdites
  sont listées.
- Aucune requête vers un tiers pour les polices : rien à déclarer pour elles dans la politique
  de confidentialité.

**À surveiller**

- Le fond orange du bouton se distingue peu du blanc (2,87) et du rose pâle (2,23). Pas de
  contour pour l'instant : à vérifier sur un vrai téléphone en plein jour lors des finitions.
- Le voile du hero doit garantir au moins 4,5 pour le texte blanc, quelle que soit l'image de
  la vidéo. La vidéo (boucle de 6 s maximum, ~1,5 Mo) et le logo HD ou SVG restent à fournir ;
  un logo texte provisoire en Archivo est utilisé d'ici là.
