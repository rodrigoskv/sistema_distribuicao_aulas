import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedDefaults00021759120000001 implements MigrationInterface {
  name = 'SeedDefaults00021759120000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Disciplinas padrão (BNCC mais comuns)
    await queryRunner.query(`
      INSERT IGNORE INTO subject (code, name, active) VALUES
        ('PORT','Língua Portuguesa',1),
        ('MAT','Matemática',1),
        ('CIE','Ciências',1),
        ('HIST','História',1),
        ('GEO','Geografia',1),
        ('EF','Educação Física',1),
        ('ART','Arte',1),
        ('ING','Inglês',1),
        ('ESP','Espanhol',1),
        ('ER','Ensino Religioso',1),
        ('INF','Informática',1);
    `);

    // Timeslots padrão: 5 por período (manhã/tarde), seg..sex
    const labelsM = ['07:30–08:20','08:20–09:10','09:20–10:10','10:10–11:00','11:00–11:50'];
    const labelsA = ['13:30–14:20','14:20–15:10','15:20–16:10','16:10–17:00','17:00–17:50'];

    for (let day = 1; day <= 5; day++) {
      for (let i = 0; i < labelsM.length; i++) {
        await queryRunner.query(
          `INSERT IGNORE INTO timeslot (day, shift, \`index\`, label, isTeaching) VALUES (?, 'MATUTINO', ?, ?, 1)`,
          [day, i + 1, labelsM[i]]
        );
      }
      for (let i = 0; i < labelsA.length; i++) {
        await queryRunner.query(
          `INSERT IGNORE INTO timeslot (day, shift, \`index\`, label, isTeaching) VALUES (?, 'VESPERTINO', ?, ?, 1)`,
          [day, i + 1, labelsA[i]]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover apenas o que esta seed inseriu (opcional)
    await queryRunner.query(`DELETE FROM timeslot`);
    await queryRunner.query(`
      DELETE FROM subject
      WHERE code IN ('PORT','MAT','CIE','HIST','GEO','EF','ART','ING','ESP','ER','INF')
    `);
  }
}
