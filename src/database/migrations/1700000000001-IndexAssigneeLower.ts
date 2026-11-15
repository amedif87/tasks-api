import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndexAssigneeLower1700000000001 implements MigrationInterface {
  name = 'IndexAssigneeLower1700000000001';

  async up(q: QueryRunner): Promise<void> {
    await q.query('CREATE INDEX "IDX_tasks_assignee_lower" ON "tasks" (LOWER("assignee"))');
    await q.query('DROP INDEX "IDX_tasks_assignee"');
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('CREATE INDEX "IDX_tasks_assignee" ON "tasks" ("assignee")');
    await q.query('DROP INDEX "IDX_tasks_assignee_lower"');
  }
}
