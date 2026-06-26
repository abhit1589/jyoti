/**
 * Fetches GeoNames India populated places and writes data/indian-places-geonames.json
 * Run: node scripts/fetch-geonames-in.mjs
 */
import { createWriteStream, mkdirSync, readFileSync, existsSync } from "fs";
import { createGunzip } from "zlib";
import { pipeline } from "stream/promises";
import { Writable } from "stream";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "data");
const OUT_FILE = join(OUT_DIR, "indian-places-geonames.json");

const IN_ADMIN1 = {
  "01": "Andaman and Nicobar",
  "02": "Andhra Pradesh",
  "03": "Assam",
  "05": "Chandigarh",
  "06": "Dadra and Nagar Haveli",
  "07": "Delhi",
  "09": "Gujarat",
  10: "Haryana",
  11: "Himachal Pradesh",
  12: "Jammu and Kashmir",
  13: "Kerala",
  14: "Lakshadweep",
  16: "Maharashtra",
  17: "Manipur",
  18: "Meghalaya",
  19: "Karnataka",
  20: "Nagaland",
  21: "Odisha",
  22: "Puducherry",
  23: "Punjab",
  24: "Rajasthan",
  25: "Sikkim",
  26: "Tamil Nadu",
  28: "Tripura",
  29: "Uttar Pradesh",
  30: "West Bengal",
  31: "Bihar",
  32: "Madhya Pradesh",
  33: "Chhattisgarh",
  34: "Jharkhand",
  35: "Uttarakhand",
  36: "Telangana",
  37: "Ladakh",
  38: "Daman and Diu",
  39: "Goa",
  40: "Arunachal Pradesh",
  41: "Mizoram",
};

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      })
      .on("error", reject);
  });
}

async function loadGeonamesDump() {
  mkdirSync(OUT_DIR, { recursive: true });
  const zipPath = join(OUT_DIR, "IN.zip");
  const txtPath = join(OUT_DIR, "IN.txt");

  if (!existsSync(txtPath)) {
    console.log("Downloading GeoNames IN.zip…");
    await download("https://download.geonames.org/export/dump/IN.zip", zipPath);
    const { execSync } = await import("child_process");
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${OUT_DIR}' -Force"`, {
      stdio: "inherit",
    });
  }

  return readFileSync(txtPath, "utf8");
}

function parsePlaces(raw) {
  const rows = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    const [
      ,
      name,
      asciiname,
      ,
      lat,
      lon,
      featureClass,
      ,
      ,
      ,
      admin1,
      ,
      ,
      ,
      population,
      ,
      ,
      timezone,
    ] = cols;

    if (featureClass !== "P") continue;
    const pop = Number(population) || 0;
    if (pop < 1500) continue;

    const state = IN_ADMIN1[admin1] ?? admin1;
    const display = asciiname || name;
    const baseId = slugify(display);
    if (!baseId) continue;

    rows.push({
      baseId,
      name: display,
      latitude: Number(lat),
      longitude: Number(lon),
      state,
      population: pop,
      timezone: timezone || "Asia/Kolkata",
    });
  }
  return rows;
}

function dedupeIds(rows) {
  const used = new Map();
  return rows.map((row) => {
    const key = row.state ? `${row.baseId}-${slugify(row.state).slice(0, 12)}` : row.baseId;
    const count = used.get(key) ?? 0;
    used.set(key, count + 1);
    const id = count === 0 ? key : `${key}-${count + 1}`;
    return { ...row, id };
  });
}

async function main() {
  const raw = await loadGeonamesDump();
  const parsed = parsePlaces(raw);
  parsed.sort((a, b) => b.population - a.population);
  const places = dedupeIds(parsed);
  const payload = places.map(({ id, name, latitude, longitude, state, population, timezone }) => ({
    id,
    name,
    latitude,
    longitude,
    state,
    population,
    timezone,
  }));

  const { writeFileSync } = await import("fs");
  writeFileSync(OUT_FILE, JSON.stringify(payload), "utf8");
  console.log(`Wrote ${payload.length} places to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
