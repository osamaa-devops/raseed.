const { createHash } = require("node:crypto");
const { promises: fs } = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const installerPath = path.join(root, "release", "RaseedSetup.exe");
const outputPath = path.join(root, "release", "SHA256SUMS.txt");

async function main() {
  const installer = await fs.readFile(installerPath);
  const hash = createHash("sha256").update(installer).digest("hex");
  await fs.writeFile(outputPath, `${hash}  RaseedSetup.exe\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
