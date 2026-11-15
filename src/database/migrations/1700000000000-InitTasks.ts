import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTasks1700000000000 implements MigrationInterface {
  name = 'InitTasks1700000000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "tasks" (
        "id" varchar PRIMARY KEY NOT NULL,
        "title" varchar(120) NOT NULL,
        "description" text,
        "status" varchar(20) NOT NULL DEFAULT ('pending')
          CHECK ("status" IN ('pending', 'in_progress', 'done')),
        "assignee" varchar(100),
        "due_date" varchar(30),
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
      )`);
    await q.query(`CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")`);
    await q.query(`CREATE INDEX "IDX_tasks_assignee" ON "tasks" ("assignee")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "IDX_tasks_assignee"`);
    await q.query(`DROP INDEX "IDX_tasks_status"`);
    await q.query(`DROP TABLE "tasks"`);
  }
}
