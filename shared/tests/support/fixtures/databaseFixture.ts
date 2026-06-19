import { Client } from 'pg';
import { createAPIClient } from '@dddforum/shared/src/api';
import { CreateUserInput } from '@dddforum/shared/src/api/users';

export class DatabaseFixture {
  private apiClient = createAPIClient(
    process.env.API_BASE_URL ?? 'http://localhost:3000',
  );

  async setupExistingUsers(users: CreateUserInput[]) {
    await Promise.all(users.map((user) => this.apiClient.users.register(user)));
  }

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
