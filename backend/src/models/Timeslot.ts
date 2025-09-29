import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity() export class Timeslot {
  @PrimaryGeneratedColumn() id!: number;
  @Column() day!: number;
  @Column() shift!: 'MATUTINO'|'VESPERTINO'|'CONTRATURNO';
  @Column() index!: number;
  @Column() label!: string;
  @Column({ default: true }) isTeaching!: boolean;
}
