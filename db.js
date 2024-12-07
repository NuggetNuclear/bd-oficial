import { neon } from '@neondatabase/serverless';

const sql = neon(
  'postgresql://neondb_owner:4soOGTtmF7Mh@ep-small-dream-a51ryonp.us-east-2.aws.neon.tech/neondb?sslmode=require'
);

export default sql;
