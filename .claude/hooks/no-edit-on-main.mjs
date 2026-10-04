// Hook PreToolUse : interdit de modifier des fichiers quand on est sur la branche `main`.
// Reçoit sur stdin le JSON de l'événement. Code de sortie 2 = action bloquée (message sur stderr).
// En l'absence de dépôt git, ou à la moindre erreur, on laisse passer : un hook cassé
// ne doit jamais empêcher de travailler.
import { execFileSync } from "node:child_process";

const BRANCHE_INTERDITE = "main";
const MESSAGE =
  "Interdit de modifier des fichiers sur main : crée d'abord une branche (feat/, fix/, chore/…)";

// On consomme stdin même si on ne s'en sert pas : sans ça le processus appelant peut rester bloqué.
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let branche;
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    branche = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: projectDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    // Pas un dépôt git, git absent, dépôt sans commit… : on n'a rien à dire.
    process.exit(0);
  }

  // `HEAD` = HEAD détachée (rebase, checkout d'un tag) : ce n'est pas `main`, on laisse passer.
  if (branche === BRANCHE_INTERDITE) {
    process.stderr.write(MESSAGE + "\n");
    process.exit(2);
  }
  process.exit(0);
});
