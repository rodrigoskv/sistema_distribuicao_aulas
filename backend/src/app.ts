import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { api } from './routes/basic';
import { scheduleRouter } from './routes/schedule';
import { importRouter } from './routes/imports';
import { exportRouter } from './routes/export';
import { teachersRouter } from './routes/teachers';
import { classesRouter } from './routes/classes';
import { subjectsRouter } from './routes/subjects';
import { importExportRouter } from './routes/importExport';


export const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage() });
app.use('/api', api);
app.use('/api', importRouter(upload));
app.use('/api/schedule', scheduleRouter);
app.use('/api/export', exportRouter);
app.use('/api', subjectsRouter);
app.use('/api', teachersRouter);
app.use('/api', classesRouter);
app.use('/api', importExportRouter);