import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';

// Choose an available port so this check can run alongside local development.
const probe=createServer();
await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});
const port=probe.address().port;
await new Promise(resolve=>probe.close(resolve));
const child=spawn(process.execPath,['server.js'],{
 env:{...process.env,NODE_ENV:'production',PORT:String(port)},stdio:['ignore','pipe','pipe']
});
let output='';
child.stdout.on('data',chunk=>{output+=chunk;});
child.stderr.on('data',chunk=>{output+=chunk;});
const stopped=new Promise(resolve=>child.once('exit',resolve));
const base=`http://127.0.0.1:${port}`;
try{
 let ready=false;
 for(let attempt=0;attempt<100;attempt++){
  if(child.exitCode!==null)throw new Error(`Website exited during startup:\n${output}`);
  try{
   const response=await fetch(`${base}/api/health`,{signal:AbortSignal.timeout(1000)});
   assert.equal(response.status,200);
   assert.equal((await response.json()).status,'ok');
   ready=true;break;
  }catch{await delay(100);}
 }
 assert.ok(ready,`Website did not become healthy:\n${output}`);
 const page=await fetch(base);
 assert.equal(page.status,200);
 const html=await page.text();
 assert.match(html,/<title>Alert X/);
 const asset=html.match(/src="(\/assets\/[^\"]+\.js)"/);
 assert.ok(asset,'Production HTML must reference a compiled JavaScript asset');
 assert.equal((await fetch(base+asset[1])).status,200);
 assert.equal(await (await fetch(`${base}/records`)).text(),html,'SPA navigation must serve the built page');
 const time=await (await fetch(`${base}/api/time`)).json();
 assert.equal(time.success,true);
 assert.equal(time.timezone,'Asia/Manila');
 console.log('Production website passed health, page, asset, SPA fallback, and time API checks');
}finally{
 if(child.exitCode===null)child.kill();
 await stopped;
}
