import 'reflect-metadata';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';

async function bootstrap() {
  mkdirSync(dirname(process.env.DB_PATH ?? 'data/tasks.sqlite'), { recursive: true });
  const app = setupApp(await NestFactory.create(AppModule));
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Tasks API listening on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();
