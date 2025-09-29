import { Router } from 'express';
import type multer from 'multer';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { AppDataSource } from '../db/data-source';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { SchoolClass } from '../models/SchoolClass';
import { WeeklyLoad } from '../models/WeeklyLoad';

type Shift = 'MATUTINO' | 'VESPERTINO';

function parseBool(v: any): boolean {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'sim' || s === 'yes';
}

const VALID_CODES = new Set(['PORT','MAT','CIE','HIST','GEO','EF','ART','ING','ESP','ER','INF']);
function normalizeSubjectCodes(input: string | string[]): string {
  const arr = Array.isArray(input) ? input : String(input || '').split(/[;,]/);
  const norm = arr.map(s => s.trim().toUpperCase()).filter(c => VALID_CODES.has(c));
  return Array.from(new Set(norm)).join(','); // "PORT,MAT,..."
}

function detectCsvType(rows: any[]): 'teachers' | 'classes' | 'unknown' {
  if (!rows.length) return 'unknown';
  const headers = Object.keys(rows[0]).map(h => h.toLowerCase());
  if (headers.includes('subjects')) return 'teachers';
  if (headers.includes('class_name') && headers.some(h => h.startsWith('weekly_'))) return 'classes';
  return 'unknown';
}

async function importTeachersRows(rows: any[]) {
  const repo = AppDataSource.getRepository(Teacher);
  for (const r of rows) {
    const subjectCodes = normalizeSubjectCodes((r.subjects ?? r.subjectCodes ?? '').replace(/;/g, ','));
    if (!subjectCodes) continue;

    const data: Partial<Teacher> = {
      name: r.name,
      email: r.email,
      subjectCodes,
      maxWeeklyLoad: Number(r.max_weekly_load ?? r.maxWeeklyLoad ?? 0),
      // flags de disponibilidade via CSV: available_morning/afternoon/contraturno
      // ou colunas com nomes equivalentes
      availableMorning: parseBool(r.available_morning ?? r.morning ?? r.disp_manha),
      availableAfternoon: parseBool(r.available_afternoon ?? r.afternoon ?? r.disp_tarde),
      availableCounterShift: parseBool(r.available_contraturno ?? r.contraturno ?? r.disp_contraturno),
    };

    // upsert por email (único)
    const existing = await repo.findOne({ where: { email: data.email! } });
    if (existing) {
      await repo.update(existing.id, data);
    } else {
      await repo.save(repo.create(data));
    }
  }
}

async function importClassesRows(rows: any[]) {
  const cRepo = AppDataSource.getRepository(SchoolClass);
  const wRepo = AppDataSource.getRepository(WeeklyLoad);

  for (const r of rows) {
    const name = r.class_name ?? r.name;
    const gradeYear = Number(r.grade_year ?? r.gradeYear ?? 1);
    const shift: Shift = (String(r.shift ?? 'MATUTINO').toUpperCase() as Shift);
    const hasContraturno = [6,7,8,9].includes(gradeYear);

    if (!name) continue;

    // upsert por name (único)
    let cls = await cRepo.findOne({ where: { name } });
    if (cls) {
      await cRepo.update(cls.id, { gradeYear, shift, hasContraturno });
      cls = await cRepo.findOneBy({ id: cls.id });
    } else {
      cls = await cRepo.save(cRepo.create({ name, gradeYear, shift, hasContraturno }));
    }

    // substituir todas as cargas semanais
    await wRepo.delete({ schoolClassId: cls!.id });

    // capturar colunas weekly_*
    for (const key of Object.keys(r)) {
      if (key.toLowerCase().startsWith('weekly_')) {
        const code = key.substring(7).toUpperCase(); // weekly_PORT -> PORT
        if (!VALID_CODES.has(code)) continue;
        const hours = Number(r[key] ?? 0);
        if (hours > 0) {
          await wRepo.save(wRepo.create({
            schoolClassId: cls!.id,
            subjectCode: code,
            hoursPerWeek: hours
          }));
        }
      }
    }
  }
}

async function importSubjectsRows(rows: any[]) {
  const sRepo = AppDataSource.getRepository(Subject);
  for (const r of rows) {
    const code = String(r.code || '').toUpperCase();
    const name = r.name ?? r.nome ?? '';
    if (!code || !name) continue;
    const exists = await sRepo.findOne({ where: { code } });
    if (exists) {
      await sRepo.update(exists.id, { name, active: true });
    } else {
      await sRepo.save(sRepo.create({ code, name, active: true }));
    }
  }
}

export function importRouter(upload: ReturnType<typeof multer>) {
  const r = Router();


  r.post('/import', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'file required' });


      if (/\.(xlsx|xlsm|xls)$/i.test(req.file.originalname)) {
        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheets = Object.fromEntries(
          wb.SheetNames.map(n => [n, XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' })])
        );

        // Subjects 
        if (sheets.Subjects?.length) await importSubjectsRows(sheets.Subjects);

        // Teachers 
        if (sheets.Teachers?.length) await importTeachersRows(sheets.Teachers);

        // Classes (com colunas weekly_*)
        if (sheets.Classes?.length) await importClassesRows(sheets.Classes);

        return res.json({
          ok: true,
          imported: {
            subjects: sheets.Subjects?.length || 0,
            teachers: sheets.Teachers?.length || 0,
            classes: sheets.Classes?.length || 0
          }
        });
      }

      //CSV (uma tabela)
      const rows = parse(req.file.buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true
      });

      const kind = detectCsvType(rows);
      if (kind === 'teachers') {
        await importTeachersRows(rows);
        return res.json({ ok: true, type: 'teachers', count: rows.length });
      }
      if (kind === 'classes') {
        await importClassesRows(rows);
        return res.json({ ok: true, type: 'classes', count: rows.length });
      }

      return res.status(400).json({
        error: 'Unknown CSV schema. Expecting teachers (subjects/availability) or classes (class_name/weekly_*).'
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'import failed', detail: String(err?.message || err) });
    }
  });

  return r;
}
