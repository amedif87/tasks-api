import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Task } from '../tasks/task.entity';
import { InitTasks1700000000000 } from './migrations/1700000000000-InitTasks';

/**
 * Única fuente de verdad de la configuración de BD.
 * La usan tanto la app (TypeOrmModule) como el CLI de migraciones.
 * `synchronize` está SIEMPRE apagado: el esquema solo cambia vía migraciones.
 */
export function buildDataSourceOptions(dbPath = process.env.DB_PATH ?? 'data/tasks.sqlite'): DataSourceOptions {
  return {
    type: 'better-sqlite3',
    database: dbPath,
    entities: [Task],
    migrations: [InitTasks1700000000000],
    synchronize: false,
    migrationsRun: false,
  };
}

export default new DataSource(buildDataSourceOptions());
