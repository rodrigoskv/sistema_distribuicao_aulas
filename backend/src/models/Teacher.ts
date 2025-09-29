import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  // Códigos de disciplinas (CSV: "PORT,MAT")
  @Column({ type: 'text' })
  subjectCodes!: string;

  // Carga máx. semanal (aulas)
  @Column({ type: 'int', default: 0 })
  maxWeeklyLoad!: number;

  // --- Legado (mantido por compatibilidade, pode não ser usado) ---
  @Column({ type: 'boolean', default: false })
  availableMorning!: boolean;

  @Column({ type: 'boolean', default: false })
  availableAfternoon!: boolean;

  @Column({ type: 'boolean', default: false })
  availableCounterShift!: boolean;

  // --- NOVO: Disponibilidade por dia/turno ---
  @Column({ type: 'boolean', default: false }) monM!: boolean;
  @Column({ type: 'boolean', default: false }) monA!: boolean;
  @Column({ type: 'boolean', default: false }) tueM!: boolean;
  @Column({ type: 'boolean', default: false }) tueA!: boolean;
  @Column({ type: 'boolean', default: false }) wedM!: boolean;
  @Column({ type: 'boolean', default: false }) wedA!: boolean;
  @Column({ type: 'boolean', default: false }) thuM!: boolean;
  @Column({ type: 'boolean', default: false }) thuA!: boolean;
  @Column({ type: 'boolean', default: false }) friM!: boolean;
  @Column({ type: 'boolean', default: false }) friA!: boolean;

  // Turmas permitidas (CSV com IDs)
  @Column({ type: 'text', nullable: true })
  allowedClassIds?: string | null;
}
