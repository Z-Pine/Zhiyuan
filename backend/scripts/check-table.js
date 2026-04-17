const { pool } = require('../src/config/database');

async function checkTable() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'industries'
      ORDER BY ordinal_position
    `);
    console.log('industries表结构:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable();
