require('dotenv').config();
const {Pool} = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}
});

pool.query(`
  SELECT s.name, AVG(a.min_rank)::int as avg_rank, COUNT(*) as count
  FROM admission_scores a
  JOIN universities s ON a.university_id = s.id
  WHERE a.province = '广东' AND a.subject_type = 'physics'
  GROUP BY s.id, s.name
  ORDER BY avg_rank
  LIMIT 30
`).then(r => {
  console.log('院校平均录取位次（前30，从好到差）:');
  console.log('考生位次: 15000');
  console.log('─'.repeat(80));
  r.rows.forEach((row, i) => {
    const ratio = (row.avg_rank / 15000).toFixed(2);
    const level = ratio < 1 ? '冲刺' : ratio <= 1.5 ? '稳妥' : '保底';
    console.log(`${(i+1).toString().padStart(2)}. ${row.name.padEnd(20)} 位次:${row.avg_rank.toString().padStart(6)} (比例:${ratio}) [${level}]`);
  });
  pool.end();
}).catch(e => {
  console.error(e);
  pool.end();
});
