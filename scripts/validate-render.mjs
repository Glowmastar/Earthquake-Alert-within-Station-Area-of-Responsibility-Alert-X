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
if(services.length!==1||!api||api.type!=='web'||api.runtime!=='docker')fail('The current website must use one Docker web service named alertx-api');
if(databases.length)fail('The current website does not use a Render database');
if(api.dockerCommand!=='node server.js')fail('The website must run the compiled root server');
if(api.preDeployCommand)fail('The website must not run database migrations');
if(api.healthCheckPath!=='/api/health')fail('The website must use /api/health');
if(api.branch!=='main'||api.autoDeployTrigger!=='checksPass')fail('Deploy main only after GitHub checks pass');
const env=key=>(api.envVars||[]).find(variable=>variable.key===key)?.value;
if(env('NODE_ENV')!=='production'||env('PORT')!=='10000')fail('Production mode and port 10000 are required');
console.log('render.yaml passed YAML, Render schema, reference, and current-website deployment validation');
