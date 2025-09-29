import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'weekly_load' })
@Index('UQ_weekly_load_class_subject', ['schoolClassId', 'subjectCode'], { unique: true })
export class WeeklyLoad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'int' })
  schoolClassId!: number;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  subjectCode!: string;

  @Column({ type: 'int', default: 0 })
  hoursPerWeek!: number;
}
