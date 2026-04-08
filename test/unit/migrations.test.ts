process.env.HEALTH_MONITOR_DB = ':memory:';

import { getDb, resetDbForTests } from '../../src/db.js';
import { runMigrations } from '../../src/migrations.js';

describe('migrations', () => {
  beforeEach(() => {
    resetDbForTests();
  });

  it('creates schema_migrations entries and expected analytics structures', () => {
    const db = getDb();
    const migrations = db
      .prepare('SELECT version, description FROM schema_migrations ORDER BY version ASC')
      .all() as Array<{ version: number; description: string }>;
    const columns = db.prepare('PRAGMA table_info(servers)').all() as Array<{ name: string }>;

    expect(migrations).toEqual([
      { version: 1, description: 'initial schema' },
      { version: 2, description: 'add response time analytics support' }
    ]);
    expect(columns.map((column) => column.name)).toContain('response_time_updated_at');
  });

  it('is idempotent when rerun on the same database', () => {
    const db = getDb();

    runMigrations(db);
    runMigrations(db);

    const count = (
      db.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get() as {
        count: number;
      }
    ).count;

    expect(count).toBe(2);
  });
});
