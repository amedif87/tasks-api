import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database/data-source';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // Las migraciones se ejecutan al arrancar la app: `npm start` funciona sin pasos previos.
      useFactory: () => ({ ...buildDataSourceOptions(), migrationsRun: true }),
    }),
    TasksModule,
  ],
})
export class AppModule {}
