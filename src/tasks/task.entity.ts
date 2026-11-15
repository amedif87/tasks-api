import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TaskStatus } from './task-status.enum';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  assignee: string | null;

  // Fecha límite como ISO 8601 (UTC). Se guarda como texto ISO para que SQLite ordene bien.
  @Column({ type: 'varchar', length: 30, name: 'due_date', nullable: true })
  dueDate: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
