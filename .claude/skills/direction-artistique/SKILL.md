---
name: direction-artistique
description: Créer une identité visuelle originale et non générique pour le site (palette, typographies, composants signature, animations) à partir de l'inspiration fournie et de recherches. À utiliser pour la phase identité visuelle ou pour repenser le style d'une page.
argument-hint: <précisions éventuelles>
disable-model-invocation: true
---

Précisions : $ARGUMENTS

## Inspiration fournie
!`ls docs/inspiration 2>/dev/null`

## Interdits (le « style IA générique »)
- Police Inter / Roboto / Arial seule, dégradé violet-bleu, fond blanc + cartes grises arrondies
  identiques, emojis en guise d'icônes, hero centré « titre + sous-titre + 2 boutons » sans idée,
  animations fade-in partout. Si une proposition y ressemble, recommence.

## Étapes
1. **Analyser** tout `docs/inspiration/` (images, liens.md, barber.md). Résume ce qui revient.
2. **Chercher** : avec Playwright, visite 5 à 8 références (sites de barbers ou salons primés sur
   Awwwards / Godly, pages démo de Aceternity UI, Magic UI, React Bits, Motion Primitives).
   Capture ce qui est pertinent et note POURQUOI ça fonctionne.
3. **Proposer 3 directions très différentes**, chacune avec : un nom, une phrase d'intention,
   palette (hex + rôle de chaque couleur, contrastes AA vérifiés), paire de polices
   (Google Fonts ou Fontshare, gratuites), traitement des photos, 2 à 3 composants signature
   (source exacte : registry shadcn / Magic UI / Aceternity / React Bits / fait main),
   style d'animation (librairie + exemples précis), et ce qui la rend reconnaissable.
4. **Démontrer** : pour chaque direction, une page d'accueil de démo sur une branche
   `design/direction-<nom>` (mobile d'abord). Captures 375 px et 1280 px.
5. **Autocritique** : lance l'agent `directeur-artistique` sur chaque démo avec la question
   « est-ce que ça ressemble à un template ? ». Améliore avant de me présenter.
6. **Me présenter** les 3 directions (captures + résumé) et ATTENDRE mon choix.
   Je peux mixer (« la palette de A, les animations de C »).
7. **Consigner** uniquement ce que je valide dans `docs/DESIGN.md` (tokens précis) et écrire
   l'ADR du choix. Supprimer les branches de démo non retenues. Ne rien installer d'autre.
