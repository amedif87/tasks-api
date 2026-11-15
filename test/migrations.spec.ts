import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../src/database/data-source';

describe('Migrations', () => {
  it('apply cleanly (up), create the schema, and revert cleanly (down)', async () => {
    const ds = new DataSource(buildDataSourceOptions(':memory:'));
    await ds.initialize();
    const tableExists = async () =>
      (await ds.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'`)).length === 1;

    expect(await tableExists()).toBe(false);
    await ds.runMigrations();
    expect(await tableExists()).toBe(true);

    // El CHECK de la BD es la última barrera si algo se saltara la validación de la API.
    await expect(
      ds.query(`INSERT INTO tasks (id, title, status) VALUES ('1', 'x', 'invalid')`),
    ).rejects.toThrow(/CHECK constraint/);

    await ds.undoLastMigration();
    expect(await tableExists()).toBe(true); // Solo se revierte el índice de expresión.
    await ds.query(`INSERT INTO tasks (id, title, assignee) VALUES ('existing', 'Keep me', 'Ana')`);
    await ds.runMigrations();
    const plan = await ds.query('EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE LOWER(assignee) = LOWER(?)', ['ana']);
    expect(plan.some((row: { detail: string }) => row.detail.includes('IDX_tasks_assignee_lower'))).toBe(true);
    expect(await ds.query(`SELECT title FROM tasks WHERE id = 'existing'`)).toEqual([{ title: 'Keep me' }]);

    await ds.undoLastMigration();
    const indexes = await ds.query(`PRAGMA index_list('tasks')`);
    expect(indexes.some((index: { name: string }) => index.name === 'IDX_tasks_assignee')).toBe(true);
    expect(indexes.some((index: { name: string }) => index.name === 'IDX_tasks_assignee_lower')).toBe(false);
    await ds.undoLastMigration();
    expect(await tableExists()).toBe(false);
    await ds.destroy();
  });
});
