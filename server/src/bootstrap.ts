import {z} from 'zod';
import {transaction,pool,audit} from './db.js';
const email=z.email().parse(process.env.INITIAL_ADMIN_EMAIL);
const password=z.string().min(14).max(72).parse(process.env.INITIAL_ADMIN_PASSWORD);
try{await transaction(async c=>{
 const exists=await c.query('SELECT 1 FROM users WHERE lower(email)=lower($1)',[email]);
 if(exists.rowCount)throw new Error('Account already exists; bootstrap never overwrites existing credentials');
 const u=(await c.query(`INSERT INTO users(username,email,password_hash,full_name) VALUES($1,$1,crypt($2,gen_salt('bf',12)),$3) RETURNING user_id`,[email,password,process.env.INITIAL_ADMIN_NAME||'Alert X Administrator'])).rows[0];
 await c.query(`INSERT INTO user_roles(user_id,role_id) SELECT $1,role_id FROM roles WHERE role_code='ADMIN'`,[u.user_id]);
 await audit(c,u.user_id,'Initial administrator created');
});console.log('Administrator created. Remove INITIAL_ADMIN_PASSWORD from the environment.');}finally{await pool.end();}
