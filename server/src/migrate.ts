import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pool} from './db.js';
import {isMainModule} from './main-module.js';
export async function migrate(){
 const c=await pool.connect();
 let locked=false;
 try{
  await c.query('SELECT pg_advisory_lock(73190442)');
  locked=true;
  const exists=(await c.query("SELECT to_regclass('public.schema_migrations') AS ledger,to_regclass('public.users') AS users")).rows[0];
  if(!exists.ledger && exists.users && !process.argv.includes('--adopt-legacy'))throw new Error('Existing database detected. Back up first, then run db:migrate -- --adopt-legacy after reading UPGRADE.md');
  await c.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  for(const name of (await readdir('database/migrations')).filter(n=>n.endsWith('.sql')).sort()){
   const sql=await readFile(`database/migrations/${name}`,'utf8');const checksum=createHash('sha256').update(sql).digest('hex');
   const old=(await c.query('SELECT checksum FROM schema_migrations WHERE name=$1',[name])).rows[0];
   if(old){if(old.checksum!==checksum)throw new Error(`Migration changed after application: ${name}`);continue;}
   await c.query('BEGIN');try{
    if(!(exists.users&&!exists.ledger&&name.startsWith('001_')))await c.query(sql);
    await c.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)',[name,checksum]);await c.query('COMMIT');console.log(`Applied ${name}`);
   }catch(e){await c.query('ROLLBACK');throw e;}
  }
 }finally{
  try{if(locked)await c.query('SELECT pg_advisory_unlock(73190442)');}
  finally{c.release();}
 }
}
if(isMainModule(import.meta.url)){
 migrate().then(()=>pool.end()).catch(async e=>{console.error(e.message);await pool.end();process.exitCode=1;});
}
