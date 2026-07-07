const { spawn } = require("node:child_process");
const { promises: fs } = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";
let logsDir = path.join(root, "logs");

let backendProcess = null;
let backendRestartCount = 0;
let shuttingDown = false;
let mainWindow = null;
let backendOutputBuffer = "";

async function writeLog(message) {
  await fs.mkdir(logsDir, { recursive: true });
  await fs.appendFile(path.join(logsDir, "electron.log"), `${new Date().toISOString()} ${message}\n`, "utf8");
}

function spawnProcess(command, args, env = {}) {
  return spawn(command, args, {
    cwd: root,
    windowsHide: true,
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      ...env,
    },
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

async function showFatalScreen(message) {
  const win = new BrowserWindow({
    width: 920,
    height: 620,
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
  });

  win.on("closed", () => {
    if (!shuttingDown) {
      app.quit();
    }
  });

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <html dir="rtl">
      <head>
        <meta charset="utf-8" />
        <style>
          body { margin: 0; font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; display: grid; place-items: center; min-height: 100vh; }
          .box { max-width: 720px; padding: 32px; border: 1px solid rgba(148,163,184,.25); border-radius: 20px; background: rgba(15,23,42,.85); }
          h1 { margin: 0 0 12px; color: #f8fafc; }
          pre { white-space: pre-wrap; background: rgba(30,41,59,.85); padding: 16px; border-radius: 14px; color: #fca5a5; }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>تعذر تشغيل رصيد</h1>
          <p>هناك مشكلة في بدء قاعدة البيانات المحلية أو الباك إند.</p>
          <pre>${escapeHtml(message)}</pre>
        </div>
      </body>
    </html>
  `)}`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function backendCommand() {
  if (!app.isPackaged) {
    return {
      command: npmCmd,
      args: ["--prefix", "backend", "run", "dev"],
    };
  }

  return {
    command: process.execPath,
    args: [path.join(root, "backend", "dist", "main.js")],
  };
}

async function startBackend() {
  const { command, args } = backendCommand();
  backendOutputBuffer = "";
  backendProcess = spawn(command, args, {
    cwd: root,
    windowsHide: true,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NODE_ENV: app.isPackaged ? "production" : "development",
      RASEED_DESKTOP: "true",
      ELECTRON_RUN_AS_NODE: "1",
      RASEED_DATA_DIR: process.env.RASEED_DATA_DIR ?? (app.isPackaged ? app.getPath("userData") : path.join(root, "runtime")),
      RASEED_LOGS_DIR: logsDir,
      RASEED_BACKUP_DIR: path.join(logsDir, "backups"),
      RASEED_LICENSE_PATH: path.join(logsDir, "license.json"),
      RASEED_RUNTIME_CONFIG_PATH: path.join(logsDir, "runtime-config.json"),
    },
  });

  backendProcess.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    backendOutputBuffer += text;
    process.stdout.write(text);
  });

  backendProcess.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    backendOutputBuffer += text;
    process.stderr.write(text);
  });

  backendProcess.on("exit", async (code, signal) => {
    await writeLog(`backend.exit code=${code ?? "null"} signal=${signal ?? "null"}`);
    if (shuttingDown) return;
    if (backendRestartCount >= 3) {
      await showFatalScreen(formatBackendFailure(`الباك إند توقف أكثر من مرة. آخر كود خروج: ${code ?? "null"} / ${signal ?? "null"}`, backendOutputBuffer));
      return;
    }
    backendRestartCount += 1;
    await writeLog(`backend.restart attempt=${backendRestartCount}`);
    setTimeout(() => {
      void startBackend().catch(async (error) => {
        await writeLog(`backend.restart.failed ${error instanceof Error ? error.message : String(error)}`);
        await showFatalScreen(formatBackendFailure(error instanceof Error ? error.stack || error.message : String(error), backendOutputBuffer));
      });
    }, 1500);
  });

  backendProcess.on("error", async (error) => {
    await writeLog(`backend.error ${error.message}`);
    await showFatalScreen(formatBackendFailure(error.stack || error.message, backendOutputBuffer));
  });

  await waitFor("http://localhost:4000/api/health");
  backendRestartCount = 0;
}

function formatBackendFailure(message, output) {
  const raw = output.trim();
  const friendly = [
    message,
    raw ? `\n\nBackend output:\n${raw.slice(-4000)}` : "",
  ].join("");
  if (friendly.includes("Can't reach database server") || friendly.includes("P1001") || friendly.includes("Authentication failed against database server")) {
    return [
      "PostgreSQL is not reachable or the credentials are wrong.",
      "Install and start PostgreSQL locally, then create the raseed_dev database and raseed user.",
      "Expected local URL: postgresql://raseed:raseed_password@localhost:5432/raseed_dev?schema=public",
      "",
      friendly,
    ].join("\n");
  }
  if (friendly.includes("createdb") || friendly.includes("pg_dump") || friendly.includes("psql")) {
    return [
      "PostgreSQL command-line tools are missing from this machine.",
      "Install PostgreSQL locally so that `createdb`, `pg_dump`, and `psql` are available on PATH.",
      "",
      friendly,
    ].join("\n");
  }
  return friendly;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 950,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.RASEED_DEV_SERVER_URL) {
    void win.loadURL(process.env.RASEED_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
    return win;
  }

  void win.loadFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  return win;
}

async function bootstrapApp() {
  app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
  const dataDir = app.isPackaged ? app.getPath("userData") : path.join(root, "runtime");
  logsDir = path.join(dataDir, "logs");
  process.env.RASEED_DATA_DIR = dataDir;
  process.env.RASEED_LOGS_DIR = logsDir;
  process.env.RASEED_BACKUP_DIR = path.join(dataDir, "backups");
  process.env.RASEED_LICENSE_PATH = path.join(dataDir, "license.json");
  process.env.RASEED_RUNTIME_CONFIG_PATH = path.join(dataDir, "runtime-config.json");
  await writeLog("app.bootstrap");
  try {
    await startBackend();
    mainWindow = createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
      }
    });
  } catch (error) {
    await writeLog(`bootstrap.failed ${error instanceof Error ? error.stack || error.message : String(error)}`);
    await showFatalScreen(error instanceof Error ? error.stack || error.message : String(error));
  }
}

app.whenReady().then(() => {
  ipcMain.handle("raseed:choose-directory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });

  ipcMain.handle("raseed:choose-file", async (_event, options = {}) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: options.filters ?? [],
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });

  ipcMain.handle("raseed:show-item-in-folder", async (_event, filePath) => {
    if (filePath) shell.showItemInFolder(filePath);
    return true;
  });

  void bootstrapApp();
});

app.on("before-quit", () => {
  shuttingDown = true;
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill("SIGTERM");
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
