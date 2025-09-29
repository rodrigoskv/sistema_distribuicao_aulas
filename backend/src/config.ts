import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  db: {
    type: process.env.DB_TYPE || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || (process.env.DB_TYPE === 'mysql' ? '3306' : '5432'), 10),
    username: process.env.DB_USER || (process.env.DB_TYPE === 'mysql' ? 'root' : 'postgres'),
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'timetabling',
    sqliteFile: 'db.sqlite'
  }
};
