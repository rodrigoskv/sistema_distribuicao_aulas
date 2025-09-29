// src/routes/importExport.ts
import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { AppDataSource } from '../db/data-source';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { SchoolClass } from '../models/SchoolClass';
import { WeeklyLoad } from '../models/WeeklyLoad';

export const importExportRouter = Router();
const upload = multer({ dest: path.join(process.cwd(), 'tmp') });

// ---------- helpers ----------
function asBool(v: any): boolean {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').trim().toLowerCase();
  return ['1','true','t','sim','s','y','yes'].includes(s);
}
function asInt(v: any, def = 0){ const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : def; }
function asStr(v: any){ return String(v ?? '').trim(); }

/** Aceita arrays readonly; força item como any para evitar TS18046 */
function asCSV(rows: ReadonlyArray<any>, headers: ReadonlyArray<string>): string {
  const esc = (x: any) => {
    const s = String(x ?? '');
    if (s.includes('"') || s.includes(';') || s.includes(',') || s.includes('\n'))
      return `"${s.replace(/"/g,'""')}"`;
    return s;
  };
  const sep = ';'; // pt-BR friendly
  const head = (headers as string[]).join(sep);
  const body = (rows as any[]).map((r: any) =>
    (headers as string[]).map((h) => esc((r as any)[h])).join(sep)
  ).join('\n');
  return head + '\n' + body + '\n';
}

/** Lê CSV/XLSX e retorna array de objetos (any[]) */
function readSheetAsJson(filePath: string): any[] {
  const wb = XLSX.readFile(filePath, { cellDates: false, raw: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
}

/** Também aceita headers/rows readonly */
function sendCSV(res: Response, filename: string, headers: ReadonlyArray<string>, rows: ReadonlyArray<any>){
  const csv = asCSV(rows, headers);
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv); // BOM p/ Excel PT-BR
}

// ---------- TEMPLATES ----------
const TEMPLATES = {
  subjects: {
    headers: ['code','name','active'] as const,
    sample: [{ code: 'PORT', name: 'Língua Portuguesa', active: 'true' }] as const,
  },
  teachers: {
    headers: [
      'name','email','subjectCodes','maxWeeklyLoad','allowedClassNames',
      'monM','monA','tueM','tueA','wedM','wedA','thuM','thuA','friM','friA'
    ] as const,
    sample: [{
      name:'Simone', email:'simone@escola.local', subjectCodes:'ESP',
      maxWeeklyLoad:5, allowedClassNames:'6ºA|5ºA',
      monM:'true',monA:'true',tueM:'true',tueA:'false',wedM:'true',wedA:'true',thuM:'false',thuA:'true',friM:'false',friA:'false'
    }] as const,
  },
  classes: {
    headers: ['name','gradeYear','shift'] as const,
    sample: [{ name:'6ºA', gradeYear:6, shift:'MATUTINO' }] as const,
  },
  loads: {
    headers: ['className','subjectCode','hoursPerWeek'] as const,
    sample: [{ className:'5ºA', subjectCode:'PORT', hoursPerWeek:5 }] as const,
  },
} as const;

// ---------- GET /api/templates/:entity ----------
importExportRouter.get('/templates/:entity', (req, res) => {
  const entity = String(req.params.entity || '').toLowerCase() as keyof typeof TEMPLATES;
  const tpl = TEMPLATES[entity];
  if (!tpl) return res.status(400).send('template inválido');
  return sendCSV(res, `${entity}-template.csv`, tpl.headers, tpl.sample);
});

// ---------- GET /api/export/:entity ----------
importExportRouter.get('/export/:entity', async (req, res) => {
  const entity = String(req.params.entity || '').toLowerCase();

  if (entity === 'subjects') {
    const rows = await AppDataSource.getRepository(Subject).find();
    const headers = ['id','code','name','active'] as const;
    return sendCSV(res, 'subjects.csv', headers, rows as any[]);
  }

  if (entity === 'teachers') {
    const rows = await AppDataSource.getRepository(Teacher).find();
    const rowsAny: any[] = rows as any[];
    const shaped: any[] = rowsAny.map((r: any) => ({
      id: r.id, name: r.name, email: r.email ?? '',
      subjectCodes: r.subjectCodes ?? '',
      maxWeeklyLoad: r.maxWeeklyLoad ?? 0,
      allowedClassIds: r.allowedClassIds ?? '',
      monM: r.monM ?? false, monA: r.monA ?? false,
      tueM: r.tueM ?? false, tueA: r.tueA ?? false,
      wedM: r.wedM ?? false, wedA: r.wedA ?? false,
      thuM: r.thuM ?? false, thuA: r.thuA ?? false,
      friM: r.friM ?? false, friA: r.friA ?? false,
    }));
    const headers = ['id','name','email','subjectCodes','maxWeeklyLoad','allowedClassIds',
      'monM','monA','tueM','tueA','wedM','wedA','thuM','thuA','friM','friA'] as const;
    return sendCSV(res, 'teachers.csv', headers, shaped);
  }

  if (entity === 'classes') {
    const rows = await AppDataSource.getRepository(SchoolClass).find();
    const headers = ['id','name','gradeYear','shift','hasContraturno'] as const;
    return sendCSV(res, 'classes.csv', headers, rows as any[]);
  }

  if (entity === 'loads') {
    const rows = await AppDataSource.getRepository(WeeklyLoad).find();
    const cls = await AppDataSource.getRepository(SchoolClass).find();
    const map = new Map((cls as any[]).map((c: any) => [c.id, c.name]));
    const shaped: any[] = (rows as any[]).map((r: any) => ({
      id: r.id,
      classId: r.schoolClassId,
      className: map.get(r.schoolClassId) || '',
      subjectCode: r.subjectCode,
      hoursPerWeek: r.hoursPerWeek,
    }));
    const headers = ['id','classId','className','subjectCode','hoursPerWeek'] as const;
    return sendCSV(res, 'loads.csv', headers, shaped);
  }

  return res.status(400).send('entity inválida');
});

// ---------- POST /api/import/:entity ----------
importExportRouter.post('/import/:entity', upload.single('file'), async (req, res) => {
  const entity = String(req.params.entity || '').toLowerCase();
  if (!req.file) return res.status(400).send('arquivo ausente');

  const filePath = req.file.path;
  const rows: any[] = readSheetAsJson(filePath) as any[];
  fs.unlink(req.file.path, () => {}); // limpa tmp

  const errors: Array<{row:number; error:string}> = [];
  let inserted = 0, updated = 0;

  try {
    if (entity === 'subjects') {
      const repo = AppDataSource.getRepository(Subject);
      for (let i=0;i<rows.length;i++){
        const r: any = rows[i];
        const code = asStr(r.code).toUpperCase();
        const name = asStr(r.name);
        const active = asBool(r.active);
        if (!code || !name){ errors.push({row:i+2, error:'code e name são obrigatórios'}); continue; }
        const existing = await repo.findOne({ where: { code } });
        if (existing){
          (existing as any).name = name; (existing as any).active = active;
          await repo.save(existing); updated++;
        } else {
          await repo.save(repo.create({ code, name, active } as any)); inserted++;
        }
      }
      return res.json({ ok:true, entity, inserted, updated, errors });
    }

    if (entity === 'teachers') {
      const repo = AppDataSource.getRepository(Teacher);
      const classRepo = AppDataSource.getRepository(SchoolClass);
      const classByName = new Map((await classRepo.find()).map((c:any)=>[c.name, c.id]));

      for (let i=0;i<rows.length;i++){
        const r: any = rows[i];
        const name = asStr(r.name);
        if (!name){ errors.push({row:i+2, error:'name é obrigatório'}); continue; }

        const email = asStr(r.email);
        const subjectCodes = asStr(r.subjectCodes).split(/[|,]/).map(s=>s.trim().toUpperCase()).filter(Boolean).join(',');
        const maxWeeklyLoad = asInt(r.maxWeeklyLoad, 0);

        const allowedClassNames = asStr(r.allowedClassNames);
        const allowedIds = allowedClassNames
            ? allowedClassNames.split('|').map(s=>classByName.get(s.trim())).filter(Boolean) as number[]
            : [];

        const patch:any = {
          email: email || null,
          subjectCodes,
          maxWeeklyLoad,
          allowedClassIds: allowedIds.join(','),
          monM: asBool(r.monM), monA: asBool(r.monA),
          tueM: asBool(r.tueM), tueA: asBool(r.tueA),
          wedM: asBool(r.wedM), wedA: asBool(r.wedA),
          thuM: asBool(r.thuM), thuA: asBool(r.thuA),
          friM: asBool(r.friM), friA: asBool(r.friA),
        };

        const existing = await repo.findOne({ where: { name } });
        if (existing){ await repo.update(existing.id, patch); updated++; }
        else { await repo.save(repo.create({ name, ...patch })); inserted++; }
      }
      return res.json({ ok:true, entity, inserted, updated, errors });
    }

    if (entity === 'classes') {
      const repo = AppDataSource.getRepository(SchoolClass);
      for (let i=0;i<rows.length;i++){
        const r: any = rows[i];
        const name = asStr(r.name);
        const gradeYear = asInt(r.gradeYear);
        const shift = asStr(r.shift).toUpperCase() as 'MATUTINO'|'VESPERTINO';
        if (!name || !gradeYear || !['MATUTINO','VESPERTINO'].includes(shift)){
          errors.push({row:i+2, error:'name, gradeYear e shift (MATUTINO/VESPERTINO) são obrigatórios'});
          continue;
        }
        const patch:any = { name, gradeYear, shift, hasContraturno: [6,7,8,9].includes(gradeYear) };
        const existing = await repo.findOne({ where: { name } });
        if (existing){ await repo.update(existing.id, patch); updated++; }
        else { await repo.save(repo.create(patch)); inserted++; }
      }
      return res.json({ ok:true, entity, inserted, updated, errors });
    }

    if (entity === 'loads') {
      const loadRepo = AppDataSource.getRepository(WeeklyLoad);
      const classRepo = AppDataSource.getRepository(SchoolClass);
      const classByName = new Map((await classRepo.find()).map((c:any)=>[c.name, c.id]));

      for (let i=0;i<rows.length;i++){
        const r: any = rows[i];
        const className = asStr(r.className);
        const classId = classByName.get(className);
        const subjectCode = asStr(r.subjectCode).toUpperCase();
        const hoursPerWeek = asInt(r.hoursPerWeek, 0);
        if (!classId || !subjectCode){ errors.push({row:i+2, error:'className válido e subjectCode são obrigatórios'}); continue; }
        // upsert por (classId, subjectCode)
        const exist = await loadRepo.findOne({ where: { schoolClassId: classId as number, subjectCode } });
        if (exist){
          (exist as any).hoursPerWeek = hoursPerWeek; await loadRepo.save(exist); updated++;
        } else {
          await loadRepo.save(loadRepo.create({ schoolClassId: classId as number, subjectCode, hoursPerWeek })); inserted++;
        }
      }
      return res.json({ ok:true, entity, inserted, updated, errors });
    }

    return res.status(400).send('entity inválida');

  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
});
