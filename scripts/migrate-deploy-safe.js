/**
 * Run prisma migrate deploy; if advisory lock times out but DB is already
 * up to date, allow the build to continue (common on Neon + Vercel).
 */
const { execSync } = require("node:child_process");

// Preview/dev deploys should not keep production Neon awake with migrate locks.
if (process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "production") {
  console.log(
    `Skipping migrate deploy on Vercel ${process.env.VERCEL_ENV ?? "non-production"}.`,
  );
  process.exit(0);
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

const MAX_LOCK_RETRIES = 4;

try {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_LOCK_RETRIES; attempt += 1) {
    try {
      run("npx prisma migrate deploy");
      console.log("Migrations applied successfully.");
      process.exit(0);
    } catch (err) {
      lastError = `${err.stdout ?? ""}${err.stderr ?? ""}${err.message ?? ""}`;
      const locked =
        lastError.includes("P1002") || lastError.includes("advisory lock");
      if (!locked || attempt === MAX_LOCK_RETRIES) {
        throw err;
      }
      console.warn(
        `migrate deploy timed out on advisory lock (attempt ${attempt}/${MAX_LOCK_RETRIES}) — retrying…`,
      );
      sleep(8000);
    }
  }
} catch (err) {
  const output = `${err.stdout ?? ""}${err.stderr ?? ""}${err.message ?? ""}`;

  if (!output.includes("P1002") && !output.includes("advisory lock")) {
    console.error(output);
    process.exit(1);
  }

  console.warn(
    "migrate deploy timed out on advisory lock — checking migration status…",
  );

  try {
    const status = run("npx prisma migrate status");
    if (status.includes("Database schema is up to date")) {
      console.log("Database schema is already up to date. Continuing build.");
      process.exit(0);
    }
    console.error(status);
  } catch (statusErr) {
    console.error(statusErr.stdout ?? statusErr.message);
  }

  process.exit(1);
}
