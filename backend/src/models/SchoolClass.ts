import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SchoolClass {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true }) name!: string;
  @Column() shift!: 'MATUTINO'|'VESPERTINO';
  @Column({ type: 'int' }) gradeYear!: number;      // 1..9
  @Column({ default: false }) hasContraturno!: boolean;
}