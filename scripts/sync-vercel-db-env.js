/**
 * Push Neon connection strings to Vercel production env.
 * Usage: node scripts/sync-vercel-db-env.js
 */
const { execSync } = require("node:child_process");

/** Vercel-linked Scale project (primary production). */
const ORG_ID = process.env.NEON_ORG_ID || "org-odd-dew-54696159";
const PROJECT_ID = process.env.NEON_PROJECT_ID || "square-sunset-58374861";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

function getConnectionString() {
  return run(
    `npx neonctl connection-string --project-id ${PROJECT_ID} --org-id ${ORG_ID}`,
  ).trim();
}

function parseUrl(url) {
  const parsed = new URL(url);
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const host = parsed.hostname;
  const database = parsed.pathname.replace(/^\//, "") || "neondb";
  const poolerHost = host.includes("-pooler")
    ? host
    : host.replace(/^ep-/, "ep-").replace(".", "-pooler.");
  const pooler =
    poolerHost === host
      ? url
      : url.replace(`@${host}`, `@${host.replace(/^([^.]+)\./, "$1-pooler.")}`);
  const prismaUrl = pooler.includes("?")
    ? `${pooler}&pgbouncer=true&connection_limit=1&connect_timeout=15`
    : `${pooler}?pgbouncer=true&connection_limit=1&connect_timeout=15`;
  return {
    direct: url,
    pooler: prismaUrl.replace("&pgbouncer=true&connect_timeout=15", "").replace("?pgbouncer=true&connect_timeout=15", "") || url,
    prisma: prismaUrl,
    host,
    poolerHost: host.includes("-pooler") ? host : host.replace(/^([^.]+)\./, "$1-pooler."),
    user,
    password,
    database,
  };
}

function updateEnv(name, value, environment = "production") {
  try {
    execSync(`npx vercel env update ${name} ${environment} --yes`, {
      input: value,
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log(`Updated ${name}`);
  } catch {
    execSync(`npx vercel env add ${name} ${environment} --yes`, {
      input: value,
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log(`Added ${name}`);
  }
}

function main() {
  const direct = getConnectionString();
  const poolerBase = direct.replace(
    /@ep-([^.]+)\./,
    (_, id) => `@ep-${id}-pooler.`,
  );
  const prismaUrl = poolerBase.includes("?")
    ? `${poolerBase}&pgbouncer=true&connection_limit=1&connect_timeout=15`
    : `${poolerBase}?pgbouncer=true&connection_limit=1&connect_timeout=15`;

  const parsed = new URL(direct);
  const host = parsed.hostname;
  const poolerHost = host.replace(/^([^.]+)\./, "$1-pooler.");
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const database = parsed.pathname.replace(/^\//, "") || "neondb";

  const vars = {
    DATABASE_URL: poolerBase,
    DATABASE_URL_UNPOOLED: direct,
    POSTGRES_PRISMA_URL: prismaUrl,
    POSTGRES_URL_NON_POOLING: direct,
    POSTGRES_URL: poolerBase,
    POSTGRES_URL_NO_SSL: poolerBase.replace("?sslmode=require", ""),
    POSTGRES_HOST: poolerHost,
    PGHOST: poolerHost,
    PGHOST_UNPOOLED: host,
    POSTGRES_USER: user,
    PGUSER: user,
    POSTGRES_PASSWORD: password,
    PGPASSWORD: password,
    POSTGRES_DATABASE: database,
    PGDATABASE: database,
  };

  for (const [name, value] of Object.entries(vars)) {
    updateEnv(name, value);
  }

  console.log("Vercel production database env synced.");
}

main();
