import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {pool,query} from './db.js';
import {isMainModule} from './main-module.js';

type MigrationRow={name:string;checksum:string};

async function expectedMigrations(){
 const result=new Map<string,string>();
 for(const name of (await readdir('database/migrations')).filter(n=>n.endsWith('.sql')).sort()){
  const sql=await readFile(`database/migrations/${name}`,'utf8');
  result.set(name,createHash('sha256').update(sql).digest('hex'));
 }
 return result;
}

export async function verifyDeployment(requireWorker=false){
 const extensions=(await query<{extname:string}>("SELECT extname FROM pg_extension WHERE extname IN ('postgis','pgcrypto') ORDER BY extname")).rows.map(r=>r.extname);
 const missingExtensions=['postgis','pgcrypto'].filter(name=>!extensions.includes(name));
 if(missingExtensions.length)throw new Error(`Missing database extensions: ${missingExtensions.join(', ')}`);

 const ledgerExists=(await query<{ledger:string|null}>("SELECT to_regclass('public.schema_migrations')::text AS ledger")).rows[0]?.ledger;
 if(!ledgerExists)throw new Error('Migration ledger is missing; run the migration command first');

 const expected=await expectedMigrations();
 const applied=(await query<MigrationRow>('SELECT name,checksum FROM schema_migrations ORDER BY name')).rows;
 const appliedByName=new Map(applied.map(row=>[row.name,row.checksum]));
 const missing=[...expected.keys()].filter(name=>!appliedByName.has(name));
 const changed=[...expected].filter(([name,checksum])=>appliedByName.has(name)&&appliedByName.get(name)!==checksum).map(([name])=>name);
 const unknown=applied.filter(row=>!expected.has(row.name)).map(row=>row.name);
 if(missing.length||changed.length||unknown.length){
  throw new Error(`Migration verification failed: ${JSON.stringify({missing,changed,unknown})}`);
 }

 const worker=(await query<{worker_id:string;status:string;heartbeat_at:string;age_seconds:number}>(`SELECT worker_id,status,heartbeat_at,
  extract(epoch from now()-heartbeat_at)::int AS age_seconds FROM worker_health ORDER BY heartbeat_at DESC LIMIT 1`)).rows[0]||null;
 if(requireWorker&&(!worker||worker.status!=='RUNNING'||worker.age_seconds>90)){
  throw new Error(`Worker heartbeat is not current: ${JSON.stringify(worker)}`);
 }

 return {status:'ok',extensions,migrations:applied.length,worker};
}

async function main(){
 try{console.log(JSON.stringify(await verifyDeployment(process.argv.includes('--require-worker'))));}
 catch(error){console.error(JSON.stringify({status:'failed',message:error instanceof Error?error.message:'Unknown verification failure'}));process.exitCode=1;}
 finally{await pool.end();}
}

if(isMainModule(import.meta.url))void main();
