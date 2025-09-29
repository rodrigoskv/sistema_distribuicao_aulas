import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity() export class Demand {
  @PrimaryGeneratedColumn() id!: number;
  @Column() className!: string;
  @Column() subjectCode!: string;
  @Column() weekly!: number;
  @Column({ default: 1 }) priority!: number;
  @Column({ default: false }) needsLab!: boolean;
  @Column({ default: false }) needsQuadra!: boolean;
}
