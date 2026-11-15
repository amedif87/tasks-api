import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { setupApp } from '../src/app.setup';
import { buildDataSourceOptions } from '../src/database/data-source';
import { TasksModule } from '../src/tasks/tasks.module';

/**
 * Tests de integración HTTP: app real (mismos pipes que main.ts) sobre SQLite en memoria
 * con el esquema creado por las migraciones reales, no por `synchronize`.
 */
@Module({
  imports: [TypeOrmModule.forRoot({ ...buildDataSourceOptions(':memory:'), migrationsRun: true }), TasksModule],
})
class TestAppModule {}

describe('Tasks API', () => {
  let app: INestApplication;
  let ds: DataSource;
  const http = () => request(app.getHttpServer());
  const create = (body: object) => http().post('/tasks').send(body);

  beforeAll(async () => {
    // Misma bootstrap que main.ts (NestFactory + setupApp), sin listen(): supertest usa el http server directamente.
    app = setupApp(await NestFactory.create(TestAppModule, { logger: false }));
    await app.init();
    ds = app.get(DataSource);
  });

  beforeEach(async () => {
    await ds.query('DELETE FROM tasks');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create / read / update / delete', () => {
    it('creates a task with defaults, trims the title and normalises the due date', async () => {
      const res = await create({ title: '  Preparar demo ', dueDate: '2026-12-01T10:00:00-03:00' }).expect(201);

      expect(res.body).toMatchObject({
        title: 'Preparar demo',
        status: 'pending',
        description: null,
        assignee: null,
        dueDate: '2026-12-01T13:00:00.000Z',
      });
      await http().get(`/tasks/${res.body.id}`).expect(200);
    });

    it('updates partially, can clear optional fields with null and rejects an empty patch', async () => {
      const { body: task } = await create({ title: 'A', assignee: 'Ana', dueDate: '2026-12-01' });

      const res = await http().patch(`/tasks/${task.id}`).send({ status: 'in_progress', assignee: null }).expect(200);
      expect(res.body).toMatchObject({ title: 'A', status: 'in_progress', assignee: null });
      expect(res.body.dueDate).toBe(task.dueDate); // lo no enviado no se toca

      await http().patch(`/tasks/${task.id}`).send({}).expect(400);
      await http().patch(`/tasks/${task.id}`).send({ title: null }).expect(400);
    });

    it('deletes a task (204) and then answers 404', async () => {
      const { body: task } = await create({ title: 'Borrar' });
      await http().delete(`/tasks/${task.id}`).expect(204);
      await http().get(`/tasks/${task.id}`).expect(404);
      await http().delete(`/tasks/${task.id}`).expect(404);
    });
  });

  describe('validation and error codes', () => {
    it.each([
      ['missing title', { description: 'x' }],
      ['blank title', { title: '   ' }],
      ['title too long', { title: 'x'.repeat(121) }],
      ['invalid status', { title: 'x', status: 'blocked' }],
      ['unknown field', { title: 'x', priority: 'high' }],
      ['impossible date', { title: 'x', dueDate: '2026-02-30' }],
      ['non-date due date', { title: 'x', dueDate: 'mañana' }],
      ['ISO week date', { title: 'x', dueDate: '2026-W01-1' }],
      ['compact ISO date', { title: 'x', dueDate: '20261201' }],
      ['datetime without timezone', { title: 'x', dueDate: '2026-12-01T10:00:00' }],
    ])('rejects %s with 400', async (_name, body) => {
      const res = await create(body).expect(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('answers 400 for a malformed id and 404 for an unknown one', async () => {
      await http().get('/tasks/not-a-uuid').expect(400);
      await http().get('/tasks/00000000-0000-4000-8000-000000000000').expect(404);
      await http().patch('/tasks/00000000-0000-4000-8000-000000000000').send({ title: 'x' }).expect(404);
    });

    it('rejects unsupported dates in PATCH without changing the task', async () => {
      const { body: task } = await create({ title: 'Date validation', dueDate: '2026-12-01' }).expect(201);
      for (const dueDate of ['2026-W01-1', '20261201', '2026-12-01T10:00:00', '2026-02-30']) {
        await http().patch(`/tasks/${task.id}`).send({ dueDate }).expect(400);
      }
      const { body } = await http().get(`/tasks/${task.id}`).expect(200);
      expect(body.dueDate).toBe('2026-12-01T00:00:00.000Z');
      await http().patch(`/tasks/${task.id}`).send({ dueDate: null }).expect(200);
    });
  });

  describe('filters and pagination', () => {
    beforeEach(async () => {
      await create({ title: 't1', status: 'pending', assignee: 'Ana' });
      await create({ title: 't2', status: 'pending', assignee: 'Luis' });
      await create({ title: 't3', status: 'done', assignee: 'Ana' });
      await create({ title: 't4', status: 'in_progress' });
      await create({ title: 't5', status: 'done', assignee: 'Ana' });
    });

    const titles = (body: { data: { title: string }[] }) => body.data.map((t) => t.title).sort();

    it('filters by status, by assignee (case-insensitive) and by both', async () => {
      const byStatus = await http().get('/tasks?status=pending').expect(200);
      expect(titles(byStatus.body)).toEqual(['t1', 't2']);

      const byAssignee = await http().get('/tasks?assignee=ana').expect(200);
      expect(titles(byAssignee.body)).toEqual(['t1', 't3', 't5']);

      const both = await http().get('/tasks?status=done&assignee=Ana').expect(200);
      expect(titles(both.body)).toEqual(['t3', 't5']);
      expect(both.body.meta.total).toBe(2);
    });

    it('paginates without repeating or skipping rows and reports meta', async () => {
      const p1 = await http().get('/tasks?page=1&limit=2').expect(200);
      const p2 = await http().get('/tasks?page=2&limit=2').expect(200);
      const p3 = await http().get('/tasks?page=3&limit=2').expect(200);

      expect(p1.body.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });
      expect([p1, p2, p3].map((r) => r.body.data.length)).toEqual([2, 2, 1]);
      const ids = [p1, p2, p3].flatMap((r) => r.body.data.map((t: { id: string }) => t.id));
      expect(new Set(ids).size).toBe(5);

      const beyond = await http().get('/tasks?page=9&limit=2').expect(200);
      expect(beyond.body.data).toEqual([]);
    });

    it('rejects invalid query params with 400', async () => {
      await http().get('/tasks?status=nope').expect(400);
      await http().get('/tasks?limit=1000').expect(400);
      await http().get('/tasks?page=0').expect(400);
      await http().get('/tasks?page=abc').expect(400);
    });

    it.each(['1e100', '9007199254740992', '1000001'])('rejects oversized page %s with 400', async (page) => {
      await http().get('/tasks').query({ page, limit: 100 }).expect(400);
    });

    it('accepts the maximum page with a safe offset', async () => {
      const { body } = await http().get('/tasks?page=1000000&limit=100').expect(200);
      expect(body.data).toEqual([]);
      expect(body.meta).toEqual({ page: 1000000, limit: 100, total: 5, totalPages: 1 });
    });
  });
});
