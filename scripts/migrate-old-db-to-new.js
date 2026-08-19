/**
 * Copy all public tables from the old Neon DB to the current production DB.
 * Usage: node scripts/migrate-old-db-to-new.js
 */
const { Client } = require("pg");

const OLD_DB =
  process.env.OLD_DATABASE_URL ||
  "postgresql://neondb_owner:npg_JR2vLU4ZQPcr@ep-plain-silence-awlbjgue.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require";

const NEW_DB =
  process.env.NEW_DATABASE_URL ||
  "postgresql://neondb_owner:npg_FAPnHaCzo0N6@ep-damp-band-au2kal26.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

const SKIP_TABLES = new Set(["_prisma_migrations"]);
const BATCH_SIZE = 25;

/** Old column name -> new column name overrides per table. */
const COLUMN_MAP = {
  Property: { floorLabel: "unitFloor" },
};

async function getTableColumns(client, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((r) => r.column_name);
}

async function getTables(client) {
  const { rows } = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  return rows.map((r) => r.tablename).filter((t) => !SKIP_TABLES.has(t));
}

async function getDependencyOrder(client, tables) {
  const { rows } = await client.query(`
    SELECT
      tc.table_name AS child,
      ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  `);

  const tableSet = new Set(tables);
  const deps = new Map(tables.map((t) => [t, new Set()]));

  for (const { child, parent } of rows) {
    if (!tableSet.has(child) || !tableSet.has(parent) || child === parent) continue;
    deps.get(child).add(parent);
  }

  const ordered = [];
  const temp = new Set();
  const perm = new Set();

  function visit(node) {
    if (perm.has(node)) return;
    if (temp.has(node)) return;
    temp.add(node);
    for (const parent of deps.get(node) || []) {
      visit(parent);
    }
    temp.delete(node);
    perm.add(node);
    ordered.push(node);
  }

  for (const table of tables) visit(table);
  return ordered;
}

async function countTable(client, table) {
  const { rows } = await client.query(`SELECT COUNT(*)::int AS c FROM "${table}"`);
  return rows[0].c;
}

async function copyTable(oldClient, newClient, table) {
  const sourceCount = await countTable(oldClient, table);
  if (sourceCount === 0) {
    console.log(`  ${table}: skip (empty)`);
    return 0;
  }

  const newColumns = new Set(await getTableColumns(newClient, table));
  const tableMap = COLUMN_MAP[table] || {};
  const { rows } = await oldClient.query(`SELECT * FROM "${table}"`);

  const mappedRows = rows.map((row) => {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
      const target = tableMap[key] || key;
      if (newColumns.has(target)) {
        out[target] = value;
      }
    }
    return out;
  });

  if (mappedRows.length === 0) {
    console.log(`  ${table}: skip (no compatible columns)`);
    return 0;
  }

  const columns = Object.keys(mappedRows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  let copied = 0;
  for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
    const batch = mappedRows.slice(i, i + BATCH_SIZE);
    const valueGroups = [];
    const values = [];
    let param = 1;

    for (const row of batch) {
      const placeholders = columns.map(() => `$${param++}`);
      valueGroups.push(`(${placeholders.join(", ")})`);
      for (const col of columns) {
        values.push(row[col]);
      }
    }

    await newClient.query(
      `INSERT INTO "${table}" (${colList}) VALUES ${valueGroups.join(", ")}`,
      values,
    );
    copied += batch.length;
  }

  console.log(`  ${table}: ${copied}/${sourceCount} rows`);
  return copied;
}

async function verify(oldClient, newClient) {
  const tables = ["User", "Property", "PropertyImage", "MediaAsset", "Agent", "Payment"];
  console.log("\nVerification:");
  let allOk = true;
  for (const table of tables) {
    const oldCount = await countTable(oldClient, table);
    const newCount = await countTable(newClient, table);
    const ok = oldCount === newCount;
    if (!ok) allOk = false;
    console.log(`  ${table}: old=${oldCount} new=${newCount} ${ok ? "OK" : "MISMATCH"}`);
  }
  return allOk;
}

async function main() {
  const oldClient = new Client({ connectionString: OLD_DB, ssl: { rejectUnauthorized: false } });
  const newClient = new Client({ connectionString: NEW_DB, ssl: { rejectUnauthorized: false } });

  await oldClient.connect();
  await newClient.connect();

  try {
    console.log("Connected to old and new databases.");

    const tables = await getTables(oldClient);
    const order = await getDependencyOrder(oldClient, tables);
    console.log(`Found ${tables.length} tables. Insert order resolved.`);

    console.log("\nClearing new database…");
    const truncateList = tables.map((t) => `"${t}"`).join(", ");
    await newClient.query(`TRUNCATE TABLE ${truncateList} RESTART IDENTITY CASCADE`);

    console.log("\nCopying data…");
    for (const table of order) {
      await copyTable(oldClient, newClient, table);
    }

    const ok = await verify(oldClient, newClient);
    if (!ok) {
      process.exitCode = 1;
      console.error("\nMigration finished with mismatches.");
    } else {
      console.log("\nMigration complete — all key tables match.");
    }
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
