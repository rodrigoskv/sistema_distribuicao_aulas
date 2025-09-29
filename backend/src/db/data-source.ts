// backend/src/db/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { config } from '../config';

import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { SchoolClass } from '../models/SchoolClass';
import { WeeklyLoad } from '../models/WeeklyLoad';
import { Timeslot } from '../models/Timeslot';
import { Lesson } from '../models/Lesson';
import { Schedule } from '../models/Schedule';

const isSqlite = (config.db.type || 'sqlite') === 'sqlite';

export const AppDataSource = new DataSource({
  type: config.db.type as any,
  host: !isSqlite ? config.db.host : undefined,
  port: !isSqlite ? config.db.port : undefined,
  username: !isSqlite ? config.db.username : undefined,
  password: !isSqlite ? config.db.password : undefined,
  database: !isSqlite ? config.db.database : (config.db.sqliteFile || path.join(process.cwd(), 'db.sqlite')),
  charset: !isSqlite ? 'utf8mb4' : undefined,
  extra: !isSqlite ? { decimalNumbers: true, timezone: 'Z' } : undefined,

  synchronize: false,
  logging: false,

  entities: [Subject, Teacher, SchoolClass, WeeklyLoad, Timeslot, Lesson, Schedule],
  migrations: [path.join(__dirname, '../migrations/*.{ts,js}')],
  subscribers: []
});
