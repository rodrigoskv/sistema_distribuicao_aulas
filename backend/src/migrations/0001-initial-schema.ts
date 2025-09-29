import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema00011759120000000 implements MigrationInterface {
  name = 'InitialSchema00011759120000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Subject
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subject (
        id INT NOT NULL AUTO_INCREMENT,
        code VARCHAR(16) NOT NULL,
        name VARCHAR(255) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_subject_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // SchoolClass
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS school_class (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(64) NOT NULL,
        gradeYear INT NOT NULL,
        shift VARCHAR(16) NOT NULL,
        hasContraturno TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Teacher (CSVs para subjectCodes e allowedClassIds + disponibilidade)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS teacher (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NULL,
        subjectCodes TEXT NOT NULL,
        maxWeeklyLoad INT NOT NULL DEFAULT 0,
        allowedClassIds TEXT NULL,
        monM TINYINT(1) NOT NULL DEFAULT 0,
        monA TINYINT(1) NOT NULL DEFAULT 0,
        tueM TINYINT(1) NOT NULL DEFAULT 0,
        tueA TINYINT(1) NOT NULL DEFAULT 0,
        wedM TINYINT(1) NOT NULL DEFAULT 0,
        wedA TINYINT(1) NOT NULL DEFAULT 0,
        thuM TINYINT(1) NOT NULL DEFAULT 0,
        thuA TINYINT(1) NOT NULL DEFAULT 0,
        friM TINYINT(1) NOT NULL DEFAULT 0,
        friA TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // WeeklyLoad (carga semanal por turma e disciplina)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS weekly_load (
        id INT NOT NULL AUTO_INCREMENT,
        schoolClassId INT NOT NULL,
        subjectCode VARCHAR(16) NOT NULL,
        hoursPerWeek INT NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT FK_weeklyload_class FOREIGN KEY (schoolClassId) REFERENCES school_class(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT FK_weeklyload_subject FOREIGN KEY (subjectCode) REFERENCES subject(code) ON DELETE RESTRICT ON UPDATE CASCADE,
        UNIQUE KEY UQ_weeklyload_class_subject (schoolClassId, subjectCode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Timeslot (final: shift / index)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS timeslot (
        id INT NOT NULL AUTO_INCREMENT,
        day INT NOT NULL,                          -- 1..5 (seg..sex)
        shift VARCHAR(16) NOT NULL,                -- MATUTINO / VESPERTINO / CONTRATURNO
        \`index\` INT NOT NULL,                     -- posição na manhã/tarde
        label VARCHAR(255) NOT NULL,
        isTeaching TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_timeslot_day_shift_index (day, shift, \`index\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Schedule (um "run" de geração)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS schedule (
        id INT NOT NULL AUTO_INCREMENT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fitness DECIMAL(10,4) NOT NULL DEFAULT 0,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Lesson (aulas geradas; subjectCode por código)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS lesson (
        id INT NOT NULL AUTO_INCREMENT,
        scheduleId INT NOT NULL,
        classId INT NOT NULL,
        teacherId INT NOT NULL,
        subjectCode VARCHAR(16) NOT NULL,
        day INT NOT NULL,
        shift VARCHAR(16) NOT NULL,
        slotIndex INT NOT NULL,
        resource VARCHAR(255) NULL,
        PRIMARY KEY (id),
        KEY IDX_lesson_schedule (scheduleId),
        KEY IDX_lesson_class_slot (classId, day, shift, slotIndex),
        CONSTRAINT FK_lesson_schedule FOREIGN KEY (scheduleId) REFERENCES schedule(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT FK_lesson_class FOREIGN KEY (classId) REFERENCES school_class(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT FK_lesson_teacher FOREIGN KEY (teacherId) REFERENCES teacher(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT FK_lesson_subject FOREIGN KEY (subjectCode) REFERENCES subject(code) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS lesson`);
    await queryRunner.query(`DROP TABLE IF EXISTS schedule`);
    await queryRunner.query(`DROP TABLE IF EXISTS timeslot`);
    await queryRunner.query(`DROP TABLE IF EXISTS weekly_load`);
    await queryRunner.query(`DROP TABLE IF EXISTS teacher`);
    await queryRunner.query(`DROP TABLE IF EXISTS school_class`);
    await queryRunner.query(`DROP TABLE IF EXISTS subject`);
  }
}
