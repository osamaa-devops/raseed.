const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";
const electronCmd = path.join(root, "node_modules", ".bin", isWin ? "electron.cmd" : "electron");

function run(command, args) {
  return spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
}

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    ...options,
  });
}

function waitFor(url, timeoutMs = 180000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      request.on("error", retry);
    };

    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(tick, 1000);
    };

    tick();
  });
}

async function main() {
  const setup = run(npmCmd, ["run", "local:setup"]);
  const setupCode = await new Promise((resolve) => setup.on("exit", (code) => resolve(code ?? 1)));
  if (setupCode !== 0) {
    process.exit(setupCode);
  }

  const frontend = spawnProcess(npmCmd, ["--prefix", "frontend", "run", "dev"]);

  const shutdown = () => {
    frontend.kill("SIGTERM");
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await waitFor("http://localhost:5173");

  const electron = spawnProcess(electronCmd, ["."], {
    env: {
      ...process.env,
      RASEED_DEV_SERVER_URL: "http://localhost:5173",
    },
  });

  electron.on("exit", (code) => {
    shutdown();
    process.exit(code ?? 0);
  });

  electron.on("error", (error) => {
    console.error("Electron failed to start:", error.message);
    shutdown();
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
