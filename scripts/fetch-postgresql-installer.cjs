const { createHash } = require("node:crypto");
const { createWriteStream, promises: fs } = require("node:fs");
const { get } = require("node:https");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");

const root = path.resolve(__dirname, "..");
const prerequisitesDir = path.join(root, "build", "prerequisites");
const filename = "postgresql-17.7-1-windows-x64.exe";
const url = `https://get.enterprisedb.com/postgresql/${filename}`;
const expectedByteLength = 369_012_848;
const installerPath = path.join(prerequisitesDir, filename);
const manifestPath = path.join(prerequisitesDir, "postgresql.json");

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = require("node:fs").createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function download(urlToFetch, outputPath, startAt = 0, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error("Too many redirects while downloading PostgreSQL."));
  return new Promise((resolve, reject) => {
    const request = get(urlToFetch, startAt > 0 ? { headers: { Range: `bytes=${startAt}-` } } : {}, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        download(new URL(response.headers.location, urlToFetch).toString(), outputPath, startAt, redirects + 1).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200 && response.statusCode !== 206) {
        response.resume();
        reject(new Error(`PostgreSQL download failed with HTTP ${response.statusCode}.`));
        return;
      }
      const append = startAt > 0 && response.statusCode === 206;
      pipeline(response, createWriteStream(outputPath, { flags: append ? "a" : "w" })).then(resolve, reject);
    });
    request.setTimeout(120000, () => request.destroy(new Error("Timed out downloading PostgreSQL.")));
    request.on("error", reject);
  });
}

async function main() {
  await fs.mkdir(prerequisitesDir, { recursive: true });
  const temporaryPath = `${installerPath}.part`;
  const existing = await fs.stat(installerPath).catch(() => null);
  if (existing && existing.size !== expectedByteLength) {
    await fs.rm(temporaryPath, { force: true });
    await fs.rename(installerPath, temporaryPath);
  }
  const completeInstaller = await fs.stat(installerPath).catch(() => null);
  if (!completeInstaller) {
    const partial = await fs.stat(temporaryPath).catch(() => null);
    const startAt = partial?.size ?? 0;
    console.log(`${startAt > 0 ? "Resuming" : "Downloading"} pinned PostgreSQL prerequisite: ${filename}`);
    await download(url, temporaryPath, startAt);
    const downloaded = await fs.stat(temporaryPath);
    if (downloaded.size !== expectedByteLength) {
      throw new Error(`PostgreSQL download is incomplete: expected ${expectedByteLength} bytes, received ${downloaded.size}.`);
    }
    await fs.rename(temporaryPath, installerPath);
  }
  const installerSha256 = await sha256(installerPath);
  const manifest = {
    version: 1,
    product: "PostgreSQL",
    postgresqlVersion: "17.7",
    architecture: "x64",
    filename,
    url,
    byteLength: expectedByteLength,
    sha256: installerSha256,
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`PostgreSQL prerequisite verified: ${installerSha256}`);
}

main().catch((error) => {
  console.error("The partial PostgreSQL download was kept so the next build can resume it.");
  console.error(error.message);
  process.exitCode = 1;
});
