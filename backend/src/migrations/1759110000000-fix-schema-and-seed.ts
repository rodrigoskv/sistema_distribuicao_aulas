import { MigrationInterface, QueryRunner, Table, TableIndex, TableColumn } from "typeorm";

export class FixSchemaAndSeed1759110000000 implements MigrationInterface {
  name = 'FixSchemaAndSeed1759110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SUBJECT
    const hasSubject = await queryRunner.hasTable('subject');
    if (!hasSubject) {
      await queryRunner.createTable(new Table({
        name: 'subject',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'code', type: 'varchar', length: '64', isUnique: true },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'active', type: 'tinyint', default: 1 },
        ],
      }));
    }

    // TEACHER
    const hasTeacher = await queryRunner.hasTable('teacher');
    if (!hasTeacher) {
      await queryRunner.createTable(new Table({
        name: 'teacher',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'email', type: 'varchar', length: '255', isNullable: true },
          { name: 'subjectCodes', type: 'text' },
          { name: 'maxWeeklyLoad', type: 'int', default: 0 },
          { name: 'availableMorning', type: 'tinyint', default: 0 },
          { name: 'availableAfternoon', type: 'tinyint', default: 0 },
          { name: 'availableCounterShift', type: 'tinyint', default: 0 },
          { name: 'monM', type: 'tinyint', default: 0 },
          { name: 'monA', type: 'tinyint', default: 0 },
          { name: 'tueM', type: 'tinyint', default: 0 },
          { name: 'tueA', type: 'tinyint', default: 0 },
          { name: 'wedM', type: 'tinyint', default: 0 },
          { name: 'wedA', type: 'tinyint', default: 0 },
          { name: 'thuM', type: 'tinyint', default: 0 },
          { name: 'thuA', type: 'tinyint', default: 0 },
          { name: 'friM', type: 'tinyint', default: 0 },
          { name: 'friA', type: 'tinyint', default: 0 },
          { name: 'allowedClassIds', type: 'text', isNullable: true },
        ],
      }));
    } else {
      const ensureCol = async (name: string, col: TableColumn) => {
        const exists = await queryRunner.hasColumn('teacher', name);
        if (!exists) await queryRunner.addColumn('teacher', col);
      };
      await ensureCol('allowedClassIds', new TableColumn({ name: 'allowedClassIds', type: 'text', isNullable: true }));
      const bool = (n: string) => new TableColumn({ name: n, type: 'tinyint', default: 0 });
      for (const n of ['monM','monA','tueM','tueA','wedM','wedA','thuM','thuA','friM','friA']) {
        await ensureCol(n, bool(n));
      }
      await ensureCol('maxWeeklyLoad', new TableColumn({ name: 'maxWeeklyLoad', type: 'int', default: 0 }));
      await ensureCol('subjectCodes', new TableColumn({ name: 'subjectCodes', type: 'text' }));
    }

    // SCHOOL_CLASS
    const hasClass = await queryRunner.hasTable('school_class');
    if (!hasClass) {
      await queryRunner.createTable(new Table({
        name: 'school_class',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar', length: '255', isUnique: true },
          { name: 'shift', type: 'varchar', length: '16' },
          { name: 'gradeYear', type: 'int' },
          { name: 'hasContraturno', type: 'tinyint', default: 0 },
        ],
      }));
    }

    // WEEKLY_LOAD
    const hasWL = await queryRunner.hasTable('weekly_load');
    if (!hasWL) {
      await queryRunner.createTable(new Table({
        name: 'weekly_load',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'schoolClassId', type: 'int' },
          { name: 'subjectCode', type: 'varchar', length: '64' },
          { name: 'hoursPerWeek', type: 'int', default: 0 },
        ],
        indices: [
          new TableIndex({ name: 'UX_weekly_load_class_subject', columnNames: ['schoolClassId','subjectCode'], isUnique: true }),
        ],
      }));
    } else {
      const table = await queryRunner.getTable('weekly_load');
      const hasIdx = !!table?.indices.some(i => i.name === 'UX_weekly_load_class_subject');
      if (!hasIdx) {
        await queryRunner.createIndex('weekly_load', new TableIndex({
          name: 'UX_weekly_load_class_subject',
          columnNames: ['schoolClassId','subjectCode'],
          isUnique: true
        }));
      }
    }

    // TIMESLOT
    const hasTime = await queryRunner.hasTable('timeslot');
    if (!hasTime) {
      await queryRunner.createTable(new Table({
        name: 'timeslot',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'day', type: 'int' }, // 1..5
          { name: 'shift', type: 'varchar', length: '16' }, // MATUTINO/VESPERTINO/CONTRATURNO
          { name: 'index', type: 'int' }, // 0..N
          { name: 'label', type: 'varchar', length: '64' },
          { name: 'isTeaching', type: 'tinyint', default: 1 },
        ],
      }));
    } else {
      const ensureCol = async (name: string, col: TableColumn) => {
        const exists = await queryRunner.hasColumn('timeslot', name);
        if (!exists) await queryRunner.addColumn('timeslot', col);
      };
      await ensureCol('shift', new TableColumn({ name: 'shift', type: 'varchar', length: '16', default: "'MATUTINO'" }));
      await ensureCol('index', new TableColumn({ name: 'index', type: 'int', default: 0 }));
      await ensureCol('label', new TableColumn({ name: 'label', type: 'varchar', length: '64', default: "'S0'" }));
      await ensureCol('isTeaching', new TableColumn({ name: 'isTeaching', type: 'tinyint', default: 1 }));
    }

    // SCHEDULE
    const hasSchedule = await queryRunner.hasTable('schedule');
    if (!hasSchedule) {
      await queryRunner.createTable(new Table({
        name: 'schedule',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'fitness', type: 'float', default: 0 },
        ],
      }));
    }

    // LESSON
    const hasLesson = await queryRunner.hasTable('lesson');
    if (!hasLesson) {
      await queryRunner.createTable(new Table({
        name: 'lesson',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'scheduleId', type: 'int' },
          { name: 'teacher', type: 'varchar', length: '255' },
          { name: 'subject', type: 'varchar', length: '255' },
          { name: 'schoolClass', type: 'varchar', length: '255' },
          { name: 'timeslotLabel', type: 'varchar', length: '64' },
          { name: 'resource', type: 'varchar', length: '255', isNullable: true },
          { name: 'shift', type: 'varchar', length: '16' },
          { name: 'day', type: 'int' },
          { name: 'slot', type: 'int' },
        ],
        indices: [ new TableIndex({ name: 'IX_lesson_schedule', columnNames: ['scheduleId'] }) ],
      }));
    } else {
      const ensureCol = async (name: string, col: TableColumn) => {
        const exists = await queryRunner.hasColumn('lesson', name);
        if (!exists) await queryRunner.addColumn('lesson', col);
      };
      await ensureCol('timeslotLabel', new TableColumn({ name: 'timeslotLabel', type: 'varchar', length: '64', default: "'S0'" }));
      await ensureCol('shift', new TableColumn({ name: 'shift', type: 'varchar', length: '16', default: "'MATUTINO'" }));
      await ensureCol('day', new TableColumn({ name: 'day', type: 'int', default: 1 }));
      await ensureCol('slot', new TableColumn({ name: 'slot', type: 'int', default: 0 }));
    }

    // Seed básico de timeslots (se vazio)
    const rows = await queryRunner.query(`SELECT COUNT(1) as cnt FROM timeslot`);
    const cnt = Number(rows?.[0]?.cnt ?? 0);
    if (cnt === 0) {
      const shifts = ['MATUTINO','VESPERTINO','CONTRATURNO'];
      for (const shift of shifts) {
        for (let day = 1; day <= 5; day++) {
          for (let idx = 0; idx < 6; idx++) {
            const label = `${shift[0]}${day}-${idx+1}`;
            await queryRunner.query(
              `INSERT INTO timeslot(day, shift, \`index\`, label, isTeaching) VALUES (?,?,?,?,1)`,
              [day, shift, idx, label]
            );
          }
        }
      }
    }
  }

  public async down(): Promise<void> {
    return;
  }
}
