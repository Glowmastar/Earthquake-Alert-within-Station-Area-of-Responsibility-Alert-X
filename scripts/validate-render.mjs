import {readFile} from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

const blueprintPath=new URL('../render.yaml',import.meta.url);
const schemaUrl='https://render.com/schema/render.yaml.json';
const fail=message=>{throw new Error(message);};

const source=await readFile(blueprintPath,'utf8');
const document=YAML.parseDocument(source,{uniqueKeys:true});
if(document.errors.length)fail(`render.yaml is not valid YAML:\n${document.errors.join('\n')}`);
const blueprint=document.toJS();

const schemaResponse=await fetch(schemaUrl,{signal:AbortSignal.timeout(15000)});
if(!schemaResponse.ok)fail(`Unable to load the Render Blueprint schema: HTTP ${schemaResponse.status}`);
const schema=await schemaResponse.json();
const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);
const validate=ajv.compile(schema);
if(!validate(blueprint)){
 fail(`render.yaml does not match Render's published schema:\n${validate.errors?.map(error=>`${error.instancePath||'/'} ${error.message}`).join('\n')}`);
}

const services=blueprint.services||[];
const databases=blueprint.databases||[];
const serviceNames=new Set(services.map(service=>service.name));
const databaseNames=new Set(databases.map(database=>database.name));
if(serviceNames.size!==services.length)fail('Render service names must be unique');
if(databaseNames.size!==databases.length)fail('Render database names must be unique');

for(const service of services){
 const keys=new Set();
 for(const variable of service.envVars||[]){
  if(!variable.key)continue;
  if(keys.has(variable.key))fail(`${service.name} defines ${variable.key} more than once`);
  keys.add(variable.key);
  if(variable.fromService){
   if(!serviceNames.has(variable.fromService.name))fail(`${service.name}.${variable.key} references unknown service ${variable.fromService.name}`);
   if(Boolean(variable.fromService.property)===Boolean(variable.fromService.envVarKey))fail(`${service.name}.${variable.key} must reference exactly one service property or environment variable`);
  }
  if(variable.fromDatabase&&!databaseNames.has(variable.fromDatabase.name))fail(`${service.name}.${variable.key} references unknown database ${variable.fromDatabase.name}`);
 }
}

const api=services.find(service=>service.name==='alertx-api');
const worker=services.find(service=>service.name==='alertx-worker');
const database=databases.find(item=>item.name==='alertx-db');
if(!api||api.type!=='web'||api.runtime!=='docker')fail('alertx-api must be a Docker web service');
if(!worker||worker.type!=='worker'||worker.runtime!=='docker')fail('alertx-worker must be a Docker background worker');
if(!database)fail('alertx-db must be defined');
if(api.healthCheckPath!=='/api/health')fail('alertx-api must use the database-aware /api/health endpoint');
if(api.preDeployCommand!=='node build/server/migrate.js'||worker.preDeployCommand!=='node build/server/migrate.js')fail('Both services must run the checksummed migration command before deployment');
if(worker.dockerCommand!=='node build/server/worker.js')fail('alertx-worker must run the worker entry point');
if(api.region!==worker.region||api.region!==database.region)fail('API, worker, and database must remain in the same Render region');

const env=(service,key)=>(service.envVars||[]).find(variable=>variable.key===key);
for(const service of [api,worker]){
 if(env(service,'INGESTION_ENABLED')?.value!=='false')fail(`${service.name} must deploy with ingestion disabled`);
 if(env(service,'DELIVERY_ENABLED')?.value!=='false')fail(`${service.name} must deploy with delivery disabled`);
 if(env(service,'RAW_ARCHIVE_BACKEND')?.value!=='S3')fail(`${service.name} must use the production S3 archive backend`);
 if(env(service,'DATABASE_URL')?.fromDatabase?.property!=='connectionString')fail(`${service.name} must use Render's private database connection string`);
}

for(const key of ['APP_ORIGIN','S3_BUCKET','S3_ENDPOINT','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY']){
 if(env(api,key)?.sync!==false)fail(`alertx-api.${key} must be entered securely during Blueprint creation`);
 if(env(worker,key)?.fromService?.name!=='alertx-api'||env(worker,key)?.fromService?.envVarKey!==key)fail(`alertx-worker.${key} must reference the API service's value`);
}

console.log('render.yaml passed YAML, Render schema, reference, and Alert X deployment-policy validation');
