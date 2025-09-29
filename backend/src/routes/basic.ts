import { Router } from 'express';
import { AppDataSource } from '../db/data-source';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { SchoolClass } from '../models/SchoolClass';
import { Resource } from '../models/Resource';
import { Demand } from '../models/Demand';

export const api = Router();
const repo = (m:any)=>AppDataSource.getRepository(m);

api.get('/subjects', async (_req,res)=>res.json(await repo(Subject).find()));
api.post('/subjects', async (req,res)=>res.json(await repo(Subject).save(req.body)));

api.get('/teachers', async (_req,res)=>res.json(await repo(Teacher).find()));
api.post('/teachers', async (req,res)=>{
  const { name, email, subjectCodes, maxWeeklyLoad } = req.body;
  const t = new Teacher(); t.name=name; t.email=email; t.subjectCodes=(subjectCodes||[]).join(','); t.maxWeeklyLoad=maxWeeklyLoad||0;
  res.json(await repo(Teacher).save(t));
});

api.get('/classes', async (_req,res)=>res.json(await repo(SchoolClass).find()));
api.post('/classes', async (req,res)=>res.json(await repo(SchoolClass).save(req.body)));

api.get('/resources', async (_req,res)=>res.json(await repo(Resource).find()));
api.post('/resources', async (req,res)=>res.json(await repo(Resource).save(req.body)));

api.get('/demands', async (_req,res)=>res.json(await repo(Demand).find()));
api.post('/demands', async (req,res)=>res.json(await repo(Demand).save(req.body)));
