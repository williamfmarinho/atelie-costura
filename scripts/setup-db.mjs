// Aplica supabase/schema.sql no banco. Uso: npm run db:setup
import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

const ref = new URL(env.SUPABASE_URL).hostname.split('.')[0];
const password = encodeURIComponent(env.SUPABASE_DB_PASSWORD);
const candidates = [
  `postgresql://postgres.${ref}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${password}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`,
];

const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

for (const url of candidates) {
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(sql);
    await client.query("notify pgrst, 'reload schema'");
    const { rows } = await client.query(
      "select table_name from information_schema.tables where table_schema='public' order by 1"
    );
    console.log('Schema aplicado via', url.split('@')[1]);
    console.log('Tabelas:', rows.map((r) => r.table_name).join(', '));
    await client.end();
    process.exit(0);
  } catch (e) {
    console.log('Falhou em', url.split('@')[1], '-', e.message);
    await client.end().catch(() => {});
  }
}
process.exit(1);
