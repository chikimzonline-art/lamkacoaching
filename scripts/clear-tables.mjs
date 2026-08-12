import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url: tursoUrl, authToken: tursoToken });

async function run() {
  console.log("Clearing Batch, Enrollment, and EnrollmentPayment tables...");
  try {
    await client.execute('DELETE FROM "EnrollmentPayment"');
    console.log("Cleared EnrollmentPayment");
  } catch(e) { console.log(e.message) }
  
  try {
    await client.execute('DELETE FROM "Enrollment"');
    console.log("Cleared Enrollment");
  } catch(e) { console.log(e.message) }
  
  try {
    await client.execute('DELETE FROM "Batch"');
    console.log("Cleared Batch");
  } catch(e) { console.log(e.message) }
  
  console.log("Done.");
  client.close();
}

run();
