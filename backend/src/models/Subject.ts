import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity() export class Subject {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true }) code!: string;  // 'PORT','MAT',...
  @Column() name!: string;
  @Column({ default: true }) active!: boolean;
}