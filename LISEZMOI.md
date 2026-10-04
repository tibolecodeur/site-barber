# Site barber — installation de A à Z (Windows)

## Comment tout s'articule
- **Le chat Claude (claude.ai)** = l'architecte : il prépare les consignes, étape par étape.
- **Claude Code** = l'ouvrier : il travaille DANS ce dossier (crée le projet Vite, code, teste).
- **Toi** = le chef de chantier : tu colles la consigne, il bosse, tu vérifies, tu reviens dans
  le chat pour la suivante.

---

## Étape 1 — Mettre le dossier en place (2 min)
1. Crée un dossier `Projets` dans ton dossier utilisateur : `C:\Users\<toi>\Projets`.
2. Dézippe le zip dedans. Tu obtiens `C:\Users\<toi>\Projets\site-barber`.
3. Dans l'Explorateur : **Affichage → Afficher → Éléments masqués** (pour voir les fichiers en `.`).
   Dans `site-barber`, tu dois voir : `.claude`, `docs`, `.mcp.json`, `.gitignore`, `.env.example`,
   `CLAUDE.md`, `LISEZMOI.md`, `setup-windows.ps1`.

## Étape 2 — Tout installer avec le script (10–15 min)
1. Ouvre le dossier `site-barber` dans l'Explorateur, clique dans la barre d'adresse, tape
   `powershell` puis Entrée : un PowerShell s'ouvre directement dans le dossier.
2. Lance :
   ```
   powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1
   ```
3. Le script installe ce qui manque (Node.js, Git, GitHub CLI, VS Code, Claude Code,
   le serveur TypeScript), configure Git, te connecte à GitHub et crée le dépôt local.
   Réponds aux questions (nom, email, connexion GitHub dans le navigateur).
4. S'il affiche « rouvre PowerShell », ferme-le, rouvre-le dans le dossier et relance la commande :
   il saute ce qui est déjà fait.

## Étape 3 — Lancer Claude Code (3 min)
1. Clic droit sur `site-barber` → **Ouvrir avec Code** (ou VS Code → Fichier → Ouvrir le dossier).
2. VS Code demande si tu fais confiance au dossier : **Oui**.
3. Terminal intégré : `Ctrl+ù`, puis tape `claude`.
4. Premier lancement : connecte-toi avec ton compte Claude (Pro ou plus), accepte de
   **faire confiance au dossier** et **active les serveurs MCP** du projet.
   « supabase » en erreur = normal (configuré en phase 2).

   Option : extension VS Code « Claude Code » (éditeur Anthropic) pour une interface graphique.
   Elle utilise la même configuration.

## Étape 4 — Plugins (2 min)
Dans Claude Code, tape une ligne à la fois et choisis la portée **Project** :
```
/plugin install typescript-lsp@claude-plugins-official
/plugin install security-guidance@claude-plugins-official
```
(Taste Skill pour le design s'installera juste avant la phase 3.)

## Étape 5 — Vérifier que l'agent est prêt
Contrôles rapides :
- `/context` → CLAUDE.md, SPEC.md et DESIGN.md apparaissent
- `/hooks` → PostToolUse (formatage) et Notification
- `/mcp` → playwright et shadcn connectés

Puis passe en **mode plan** (`Shift+Tab` jusqu'à « plan mode on ») et colle le test :
```
Test de configuration, ne modifie aucun fichier.
1. Résume en 5 lignes le projet et tes règles de travail (Git, tests, design, sécurité).
2. Liste tes sous-agents et tes skills pour ce projet, avec leur rôle en une ligne.
3. Liste les serveurs MCP et plugins actifs, et ceux qui ne fonctionnent pas encore.
4. Ce que tu peux faire sans demander, ce que tu dois demander, ce qui t'est interdit.
5. Si tu dois choisir une couleur pour un bouton, que fais-tu ?
6. Signale ce qui te paraît manquant, flou ou contradictoire dans la configuration.
```
Copie sa réponse dans le chat avec l'architecte. Une fois validée → consigne n°1.

---

## Ce que contient le dossier
| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | Règles permanentes : stack, méthode projet, règles métier, sécurité, design |
| `docs/SPEC.md` | Cahier des charges |
| `docs/DESIGN.md` | Décisions de design, remplies seulement quand tu les valides |
| `docs/PLAN.md` | Phases et cases à cocher |
| `docs/adr/` | Décisions techniques (modèle fourni) |
| `docs/inspiration/` | Tes captures, liens, goûts du barber |
| `.claude/settings.json` | Permissions + formatage automatique |
| `.claude/settings.local.json` | Tes réglages perso : style Explanatory, notification Windows |
| `.claude/hooks/format.mjs` | Prettier sur chaque fichier modifié |
| `.claude/agents/` | `relecteur-securite`, `testeur-ui`, `directeur-artistique` |
| `.claude/skills/` | `/nouvelle-feature`, `/nouvelle-migration`, `/direction-artistique`, `/check-deploiement` |
| `.mcp.json` | Supabase (phase 2), Playwright, shadcn |
| `setup-windows.ps1` | Le script d'installation (non commité) |

## Réflexes au quotidien
- Mode **auto** (`Shift+Tab`) pour qu'il travaille seul ; il te demande quand même pour
  installer un paquet, pousser sur GitHub ou toucher la base.
- Une consigne = une session : `/clear` entre deux.
- Contrôle : `/diff`, `npm run dev` → http://localhost:5173. Pas content : `Échap Échap` pour revenir en arrière.
- Colle son récap final dans le chat avec l'architecte pour obtenir la consigne suivante.
