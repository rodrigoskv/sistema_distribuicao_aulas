import { app } from './app';
import { config } from './config';
import { AppDataSource } from './db/data-source';
import { seed } from './seed';

AppDataSource.initialize().then(async ()=>{
  await seed();
  app.listen(config.port, ()=>console.log(`API http://localhost:${config.port}`));
}).catch(e=>{ console.error(e); process.exit(1); });
