import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity() export class Lesson {
  @PrimaryGeneratedColumn() id!: number;
  @Column() scheduleId!: number;
  @Column() teacher!: string;
  @Column() subject!: string;
  @Column() schoolClass!: string;
  @Column() timeslotLabel!: string;
  @Column({ nullable: true }) resource?: string;
  @Column() shift!: 'MATUTINO'|'VESPERTINO'|'CONTRATURNO';
  @Column() day!: number;
  @Column() slot!: number;
}
