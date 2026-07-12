const { execFileSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";
const electronBuilder = path.join(root, "node_modules", ".bin", isWin ? "electron-builder.cmd" : "electron-builder");

if (isWin && process.env.RASEED_ALLOW_UNSIGNED_RELEASE !== "true" && !process.env.CSC_LINK) {
  throw new Error("A commercial Windows release requires code signing. Set CSC_LINK and CSC_KEY_PASSWORD, or explicitly set RASEED_ALLOW_UNSIGNED_RELEASE=true for a non-commercial test build.");
}

function run(command, args) {
  try {
    execFileSync(command, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
  } catch (error) {
    if (!isWin && command === electronBuilder) {
      console.error("تعذر إكمال Windows installer على Linux الحالي. ثبّت wine32:i386 أو شغّل npm run desktop:build من جهاز Windows.");
    }
    throw error;
  }
}

run(npmCmd, ["run", "backend:build"]);
run(npmCmd, ["run", "frontend:build"]);
run(electronBuilder, ["--win", "nsis"]);
run(process.execPath, [path.join(root, "scripts", "create-release-checksum.cjs")]);
