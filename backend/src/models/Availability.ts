import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity() export class Availability {
  @PrimaryGeneratedColumn() id!: number;
  @Column() teacherId!: number;
  @Column() day!: number;
  @Column() slot!: number;
  @Column() shift!: 'MATUTINO'|'VESPERTINO'|'CONTRATURNO';
}
