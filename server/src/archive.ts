import {createHash,createHmac} from 'node:crypto';
import {query} from './db.js';
import {config} from './config.js';

type SourceResponse = {sourceId:string; ingestionRunId:string; sourceUrl:string; contentType:string; body:Buffer};
const sha256=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');
const hmac=(key:Buffer|string,value:string)=>createHmac('sha256',key).update(value).digest();
const isoStamp=(date:Date)=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const dayStamp=(date:Date)=>date.toISOString().slice(0,10).replace(/-/g,'');

function s3Url(key:string){
 const base=new URL(config.S3_ENDPOINT||`https://s3.${config.S3_REGION}.amazonaws.com`);
 const encodedKey=key.split('/').map(encodeURIComponent).join('/');
 if(config.S3_FORCE_PATH_STYLE==='true')base.pathname=`${base.pathname.replace(/\/$/,'')}/${encodeURIComponent(config.S3_BUCKET!)}/${encodedKey}`;
 else base.hostname=`${config.S3_BUCKET!}.${base.hostname}`,base.pathname=`${base.pathname.replace(/\/$/,'')}/${encodedKey}`;
 return base;
}

async function putS3(key:string,body:Buffer,contentType:string,contentHash:string){
 const now=new Date(),amzDate=isoStamp(now),date=dayStamp(now),url=s3Url(key);
 const canonicalUri=url.pathname.split('/').map(encodeURIComponent).join('/').replace(/%2F/g,'/');
 const canonicalHeaders=`host:${url.host}\nx-amz-content-sha256:${contentHash}\nx-amz-date:${amzDate}\n`;
 const signedHeaders='host;x-amz-content-sha256;x-amz-date';
 const canonicalRequest=['PUT',canonicalUri,'',canonicalHeaders,signedHeaders,contentHash].join('\n');
 const scope=`${date}/${config.S3_REGION}/s3/aws4_request`;
 const stringToSign=['AWS4-HMAC-SHA256',amzDate,scope,sha256(canonicalRequest)].join('\n');
 const signingKey=hmac(hmac(hmac(hmac(`AWS4${config.S3_SECRET_ACCESS_KEY!}`,date),config.S3_REGION),'s3'),'aws4_request');
 const signature=createHmac('sha256',signingKey).update(stringToSign).digest('hex');
 const authorization=`AWS4-HMAC-SHA256 Credential=${config.S3_ACCESS_KEY_ID!}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
 const response=await fetch(url,{method:'PUT',headers:{'content-type':contentType,'content-length':String(body.length),'x-amz-content-sha256':contentHash,'x-amz-date':amzDate,authorization},body:new Uint8Array(body)});
 if(!response.ok)throw new Error(`Raw-source archive upload failed with HTTP ${response.status}`);
}

/** Archives the exact source page before parsing. A failed archive stops ingestion. */
export async function archiveSourceResponse(input:SourceResponse){
 const contentHash=sha256(input.body),bytes=input.body.length;
 if(config.RAW_ARCHIVE_BACKEND==='DATABASE'){
  await query(`INSERT INTO source_response_archives(source_id,ingestion_run_id,source_url,content_type,content_sha256,byte_size,storage_backend,raw_payload)
   VALUES($1,$2,$3,$4,$5,$6,'DATABASE',$7)`,[input.sourceId,input.ingestionRunId,input.sourceUrl,input.contentType,contentHash,bytes,input.body.toString('utf8')]);
  return {contentHash,bytes,objectKey:null};
 }
 const now=new Date(),key=`eqinfo/${now.toISOString().slice(0,10).replace(/-/g,'/')}/run-${input.ingestionRunId}-${contentHash}.html`;
 await putS3(key,input.body,input.contentType,contentHash);
 await query(`INSERT INTO source_response_archives(source_id,ingestion_run_id,source_url,content_type,content_sha256,byte_size,storage_backend,object_key)
  VALUES($1,$2,$3,$4,$5,$6,'S3',$7)`,[input.sourceId,input.ingestionRunId,input.sourceUrl,input.contentType,contentHash,bytes,key]);
 return {contentHash,bytes,objectKey:key};
}
