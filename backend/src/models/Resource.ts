import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity() export class Resource {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true }) code!: string;
  @Column() name!: string;
  @Column({ default: true }) isExclusive!: boolean;
}
