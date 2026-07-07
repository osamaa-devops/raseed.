const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

function spawnProcess(command, args) {
  return spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
}

const backend = spawnProcess(npmCmd, ["--prefix", "backend", "run", "dev"]);
const frontend = spawnProcess(npmCmd, ["--prefix", "frontend", "run", "dev"]);

const shutdown = () => {
  backend.kill("SIGTERM");
  frontend.kill("SIGTERM");
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

backend.on("exit", (code) => {
  frontend.kill("SIGTERM");
  process.exit(code ?? 0);
});

frontend.on("exit", (code) => {
  backend.kill("SIGTERM");
  process.exit(code ?? 0);
});
