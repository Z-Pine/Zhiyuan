require('dotenv').config();
const {Pool} = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}
});

pool.query(`
  SELECT table_name, column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name IN ('universities', 'majors', 'industries', 'university_majors', 'admission_scores', 'major_industries') 
    AND column_name LIKE '%id%'
  ORDER BY table_name, column_name
`).then(r => {
  console.log('表字段类型:');
  console.log('─'.repeat(80));
  r.rows.forEach(row => {
    console.log(`${row.table_name.padEnd(25)} ${row.column_name.padEnd(20)} ${row.data_type}`);
  });
  pool.end();
}).catch(e => {
  console.error(e);
  pool.end();
});
