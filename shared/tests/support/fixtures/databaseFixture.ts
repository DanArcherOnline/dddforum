import { Client } from 'pg';

export class DatabaseFixture {
  async resetDatabase() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      const result = await client.query<{ tablename: string }>(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
      `);
      const tables = result.rows.map((r) => `"${r.tablename}"`).join(', ');
      if (tables) {
        await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
      }
    } finally {
      await client.end();
    }
  }
}
