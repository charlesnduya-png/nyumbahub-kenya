/**
 * Map Neon/Vercel Postgres env vars for Prisma (local + CI).
 * Neon on Vercel exposes POSTGRES_*; local dev often only has DATABASE_URL.
 * Treat empty strings as unset (Vercel env pull can write "").
 *
 * Serverless + Neon: pooled URL for queries, direct URL for migrations.
 * connection_limit=1 stops each Vercel isolate from opening a connection storm.
 */
function envOrEmpty(key) {
  const v = process.env[key];
  return v && String(v).trim() ? v : "";
}

function isNeonHost(hostname) {
  return /\.neon\.tech$/i.test(hostname);
}

function rewriteHostname(urlString, rewrite) {
  try {
    const parsed = new URL(urlString);
    parsed.hostname = rewrite(parsed.hostname);
    return parsed.toString();
  } catch {
    return urlString;
  }
}

function toPoolerUrl(urlString) {
  return rewriteHostname(urlString, (hostname) => {
    if (!isNeonHost(hostname) || hostname.includes("-pooler.")) return hostname;
    return hostname.replace(/^([^.]+)\./, "$1-pooler.");
  });
}

function toDirectUrl(urlString) {
  return rewriteHostname(urlString, (hostname) =>
    hostname.replace("-pooler.", "."),
  );
}

function withQueryParams(urlString, params, overwrite = false) {
  try {
    const parsed = new URL(urlString);
    for (const [key, value] of Object.entries(params)) {
      if (overwrite || !parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, value);
      }
    }
    return parsed.toString();
  } catch {
    return urlString;
  }
}

function stripQueryParams(urlString, keys) {
  try {
    const parsed = new URL(urlString);
    for (const key of keys) parsed.searchParams.delete(key);
    return parsed.toString();
  } catch {
    return urlString;
  }
}

const fallback =
  envOrEmpty("DATABASE_URL") ||
  envOrEmpty("POSTGRES_URL") ||
  envOrEmpty("POSTGRES_PRISMA_URL");

let prismaUrl = envOrEmpty("POSTGRES_PRISMA_URL") || fallback;
let directUrl =
  envOrEmpty("POSTGRES_URL_NON_POOLING") ||
  envOrEmpty("DATABASE_URL_UNPOOLED") ||
  envOrEmpty("POSTGRES_URL_NO_SSL") ||
  fallback;

function isNeonUrl(urlString) {
  try {
    return isNeonHost(new URL(urlString).hostname);
  } catch {
    return false;
  }
}

if (prismaUrl) {
  prismaUrl = toPoolerUrl(prismaUrl);
  if (isNeonUrl(prismaUrl)) {
    prismaUrl = withQueryParams(
      prismaUrl,
      {
        sslmode: "require",
        pgbouncer: "true",
        connection_limit: "1",
        connect_timeout: "15",
        pool_timeout: "10",
      },
      true,
    );
  }
  process.env.POSTGRES_PRISMA_URL = prismaUrl;
}

if (directUrl) {
  directUrl = toDirectUrl(directUrl);
  directUrl = stripQueryParams(directUrl, [
    "pgbouncer",
    "connection_limit",
    "pool_timeout",
  ]);
  process.env.POSTGRES_URL_NON_POOLING = directUrl;
}

if (!envOrEmpty("DATABASE_URL") && prismaUrl) {
  process.env.DATABASE_URL = prismaUrl;
}
