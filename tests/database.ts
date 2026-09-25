import './setup-env.js';
import {PGlite} from '@electric-sql/pglite';
import {postgis} from '@electric-sql/pglite-postgis';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {pool} from '../server/src/db.js';
export async function database(){
 if(process.env.TEST_DATABASE_URL){
  if(!new URL(process.env.TEST_DATABASE_URL).pathname.endsWith('_test'))throw new Error('Native integration database name must end in _test');
  if((await pool.query("SELECT to_regclass('public.users') AS users")).rows[0].users)throw new Error('Use an empty test database');
  return {pg:null,close:()=>pool.end()};
 }
 const pg=new PGlite({extensions:{postgis,pgcrypto}});
 let tail=Promise.resolve();
 const lock=async()=>{let unlock!:()=>void;const old=tail;tail=new Promise<void>(r=>{unlock=r;});await old;return unlock;};
 const execute=async(sql:string,params?:any[])=>{const r=params?.length?await pg.query(sql,params):(await pg.exec(sql)).at(-1);return{rows:r?.rows||[],rowCount:r?.rows.length||r?.affectedRows||0};};
 const originalEnd=pool.end.bind(pool);
 (pool as any).query=async(sql:string,params?:any[])=>{const release=await lock();try{return await execute(sql,params);}finally{release();}};
 (pool as any).connect=async()=>{const release=await lock();return{query:execute,release};};
 return{pg,close:async()=>{await pg.close();await originalEnd();}};
}
