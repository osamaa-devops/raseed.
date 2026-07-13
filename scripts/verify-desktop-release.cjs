const { createHash } = require("node:crypto");
const { createReadStream, promises: fs } = require("node:fs");
const path = require("node:path");
const { listPackage } = require("@electron/asar");

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const asarPath = path.join(releaseDir, "win-unpacked", "resources", "app.asar");

function hash(filePath) {
  return new Promise((resolve, reject) => {
    const digest = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => digest.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(digest.digest("hex")));
  });
}

async function main() {
  const requiredFiles = [
    path.join(releaseDir, "RaseedSetup.exe"),
    path.join(releaseDir, "SHA256SUMS.txt"),
    path.join(releaseDir, "win-unpacked", "resources", "support", "Bootstrap-Raseed.ps1"),
    path.join(releaseDir, "win-unpacked", "resources", "support", "Initialize-Raseed.ps1"),
    path.join(releaseDir, "win-unpacked", "resources", "prerequisites", "postgresql-17.7-1-windows-x64.exe"),
    path.join(releaseDir, "win-unpacked", "resources", "prerequisites", "postgresql.json"),
  ];
  for (const filePath of requiredFiles) await fs.access(filePath);
  if ((await fs.stat(path.join(releaseDir, "RaseedSetup.exe"))).size < 400_000_000) {
    throw new Error("RaseedSetup.exe is too small for the full offline bundle. Do not ship a web or stub installer.");
  }

  const entries = listPackage(asarPath);
  for (const entry of ["/backend/dist/src/main.js", "/backend/prisma/schema.prisma", "/node_modules/prisma/build/index.js", "/frontend/dist/index.html"]) {
    if (!entries.includes(entry)) throw new Error(`Release is missing ${entry} in app.asar.`);
  }

  const checksumLine = (await fs.readFile(path.join(releaseDir, "SHA256SUMS.txt"), "utf8")).trim();
  const expected = checksumLine.split(/\s+/)[0];
  const actual = await hash(path.join(releaseDir, "RaseedSetup.exe"));
  if (expected !== actual) throw new Error("RaseedSetup.exe does not match SHA256SUMS.txt.");

  const manifest = JSON.parse(await fs.readFile(path.join(releaseDir, "win-unpacked", "resources", "prerequisites", "postgresql.json"), "utf8"));
  const prerequisitePath = path.join(releaseDir, "win-unpacked", "resources", "prerequisites", manifest.filename);
  if ((await fs.stat(prerequisitePath)).size !== manifest.byteLength) throw new Error("Bundled PostgreSQL size does not match its manifest.");
  if (manifest.sha256 !== await hash(prerequisitePath)) throw new Error("Bundled PostgreSQL checksum does not match its manifest.");
  console.log("Desktop release verification passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
