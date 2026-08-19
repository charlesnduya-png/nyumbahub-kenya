const { Client } = require("pg");

const OLD_DB =
  "postgresql://neondb_owner:npg_JR2vLU4ZQPcr@ep-plain-silence-awlbjgue.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require";
const NEW_DB =
  "postgresql://neondb_owner:npg_FAPnHaCzo0N6@ep-damp-band-au2kal26.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function columns(url, table) {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [table],
  );
  await client.end();
  return rows.map((r) => r.column_name);
}

async function main() {
  const tables = ["Property", "User", "MediaAsset", "PropertyImage"];
  for (const table of tables) {
    const oldCols = await columns(OLD_DB, table);
    const newCols = await columns(NEW_DB, table);
    const onlyOld = oldCols.filter((c) => !newCols.includes(c));
    const onlyNew = newCols.filter((c) => !oldCols.includes(c));
    console.log(`\n${table}:`);
    if (onlyOld.length) console.log("  only old:", onlyOld.join(", "));
    if (onlyNew.length) console.log("  only new:", onlyNew.join(", "));
    if (!onlyOld.length && !onlyNew.length) console.log("  columns match");
  }
}

main();
