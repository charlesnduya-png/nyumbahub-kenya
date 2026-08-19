const fs = require("fs");
const path = require("path");

const envPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "..", ".env.production.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.production.local");
  process.exit(1);
}

const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq);
  let value = trimmed.slice(eq + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  console.log(`${key}: ${value.length > 0 ? `set (${value.length} chars)` : "EMPTY"}`);
}
