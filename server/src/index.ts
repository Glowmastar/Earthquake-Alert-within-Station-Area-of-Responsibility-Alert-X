import {app} from './app.js';
import {config} from './config.js';
import {pool} from './db.js';
const server=app.listen(config.PORT,()=>console.log(`Alert X API listening on port ${config.PORT}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>{void pool.end();});});
