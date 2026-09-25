import 'dotenv/config';
import { z } from 'zod';
const env = z.object({
 NODE_ENV:z.enum(['development','production','test']).default('development'),
 PORT:z.coerce.number().int().min(1).max(65535).default(4000),
 APP_ORIGIN:z.string().url().default('http://localhost:3000'),
 DATABASE_URL:z.string().min(1),
 DB_SSL:z.enum(['true','false']).default('false'), DB_CA_FILE:z.string().optional(),
 TRUST_PROXY:z.coerce.number().int().min(0).default(0),
 SESSION_HOURS:z.coerce.number().positive().max(24).default(8),
 INGESTION_ENABLED:z.enum(['true','false']).default('false'),
 RAW_ARCHIVE_BACKEND:z.enum(['DATABASE','S3']).default('DATABASE'),
 S3_BUCKET:z.string().trim().min(3).optional(), S3_REGION:z.string().trim().min(1).default('ap-southeast-1'),
 S3_ENDPOINT:z.string().url().optional(), S3_ACCESS_KEY_ID:z.string().min(1).optional(),
 S3_SECRET_ACCESS_KEY:z.string().min(1).optional(), S3_FORCE_PATH_STYLE:z.enum(['true','false']).default('true'),
 DELIVERY_ENABLED:z.enum(['true','false']).default('false'),
 SMTP_HOST:z.string().optional(), SMTP_PORT:z.coerce.number().int().default(587),
 SMTP_SECURE:z.enum(['true','false']).default('false'), SMTP_USER:z.string().optional(),
 SMTP_PASSWORD:z.string().optional(), EMAIL_FROM:z.string().optional(),
 OIDC_ISSUER:z.string().url().optional(), OIDC_CLIENT_ID:z.string().optional(), OIDC_CLIENT_SECRET:z.string().optional()
}).parse(process.env);
if (env.NODE_ENV==='production' && new URL(env.APP_ORIGIN).protocol!=='https:') throw new Error('APP_ORIGIN must use HTTPS in production');
if (env.DELIVERY_ENABLED==='true' && (!env.SMTP_HOST || !env.EMAIL_FROM)) throw new Error('SMTP_HOST and EMAIL_FROM are required for delivery');
if (env.RAW_ARCHIVE_BACKEND==='S3' && (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY)) {
 throw new Error('S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required when RAW_ARCHIVE_BACKEND=S3');
}
export const config={...env, origin:new URL(env.APP_ORIGIN).origin, secure:env.NODE_ENV==='production'};
