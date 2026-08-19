/**
 * Run prisma migrate deploy; if advisory lock times out but DB is already
 * up to date, allow the build to continue (common on Neon + Vercel).
 */
const { execSync } = require("node:child_process");

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

try {
  run("npx prisma migrate deploy");
  console.log("Migrations applied successfully.");
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
