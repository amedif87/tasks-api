import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';

describe('File-backed persistence', () => {
  it('keeps tasks and does not rerun applied migrations after restarting the app', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'tasks-api-test-'));
    const previousPath = process.env.DB_PATH;
    let app: INestApplication | undefined;
    process.env.DB_PATH = join(directory, 'tasks.sqlite');
    try {
      app = setupApp(await NestFactory.create(AppModule, { logger: false }));
      await app.init();
      const { body: task } = await request(app.getHttpServer()).post('/tasks')
        .send({ title: 'Persist me', assignee: 'Ana', dueDate: '2026-12-01' }).expect(201);
      await app.close();
      app = undefined;

      app = setupApp(await NestFactory.create(AppModule, { logger: false }));
      await app.init();
      const { body } = await request(app.getHttpServer()).get(`/tasks/${task.id}`).expect(200);
      expect(body).toEqual(task);
      const result = await request(app.getHttpServer()).get('/tasks?assignee=ana').expect(200);
      expect(result.body.meta.total).toBe(1);
    } finally {
      try {
        if (app) await app.close();
      } finally {
        if (previousPath === undefined) delete process.env.DB_PATH;
        else process.env.DB_PATH = previousPath;
        rmSync(directory, { recursive: true, force: true });
      }
    }
  });
});
