// Hook PostToolUse : formate avec Prettier chaque fichier que Claude vient d'éditer.
// Reçoit sur stdin le JSON de l'événement (tool_input.file_path). Ne bloque jamais Claude.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  try {
    const file = JSON.parse(raw)?.tool_input?.file_path;
    if (!file || !/\.(ts|tsx|js|jsx|css|json|md|html)$/.test(file)) return;
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    // Prettier pas encore installé (avant la phase 1) : on ne fait rien.
    if (!existsSync(join(projectDir, "node_modules", "prettier"))) return;
    execFileSync("npx", ["prettier", "--write", file], {
      cwd: projectDir,
      stdio: "ignore",
      shell: process.platform === "win32",
    });
  } catch {
    // Un échec de formatage ne doit pas interrompre le travail.
  }
});
