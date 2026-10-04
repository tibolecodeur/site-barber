// Hook PreToolUse : interdit de modifier les fichiers DU DÉPÔT quand on est sur la branche `main`.
// Reçoit sur stdin le JSON de l'événement. Code de sortie 2 = action bloquée (message sur stderr).
// Les fichiers hors du dépôt (brouillons, dossier temporaire) ne sont jamais bloqués.
// En l'absence de dépôt git, ou à la moindre erreur, on laisse passer : un hook cassé
// ne doit jamais empêcher de travailler.
import { execFileSync } from "node:child_process";
import { relative, resolve, isAbsolute } from "node:path";

const BRANCHE_INTERDITE = "main";
const MESSAGE =
  "Interdit de modifier des fichiers sur main : crée d'abord une branche (feat/, fix/, chore/…)";

/** Lance une commande git dans le dépôt et renvoie sa sortie, ou null si ça échoue. */
function git(projectDir, ...args) {
  try {
    return execFileSync("git", args, {
      cwd: projectDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/** Le chemin visé est-il à l'intérieur du dépôt ? */
function dansLeDepot(racine, fichier) {
  // `relative` renvoie un chemin qui remonte (`..`) ou un chemin absolu quand on sort de la racine
  // (autre disque sous Windows, par exemple C:\ vs D:\).
  const rel = relative(racine, resolve(racine, fichier));
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

// On consomme stdin même si l'événement est incomplet : sans ça le processus appelant peut rester bloqué.
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  const branche = git(projectDir, "rev-parse", "--abbrev-ref", "HEAD");
  // Pas un dépôt git, git absent, dépôt sans commit… : on n'a rien à dire.
  // `HEAD` = HEAD détachée (rebase, checkout d'un tag) : ce n'est pas `main`, on laisse passer.
  if (branche !== BRANCHE_INTERDITE) process.exit(0);

  const racine = git(projectDir, "rev-parse", "--show-toplevel");
  if (racine === null) process.exit(0);

  let fichier;
  try {
    fichier = JSON.parse(raw)?.tool_input?.file_path;
  } catch {
    fichier = undefined;
  }

  // Chemin illisible : on est sur `main`, donc on bloque par précaution plutôt que de laisser filer.
  // Chemin hors du dépôt : rien à protéger, on laisse passer.
  if (typeof fichier === "string" && fichier !== "" && !dansLeDepot(racine, fichier)) {
    process.exit(0);
  }

  process.stderr.write(MESSAGE + "\n");
  process.exit(2);
});
