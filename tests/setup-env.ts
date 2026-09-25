process.env.NODE_ENV='test';
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'postgresql://unused:unused@localhost:5432/alertx_test';
process.env.APP_ORIGIN='http://localhost:3000';
process.env.DELIVERY_ENABLED='false';
process.env.INGESTION_ENABLED='false';
