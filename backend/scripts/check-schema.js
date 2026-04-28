const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  const client = await pool.connect();
  try {
    // 检查核心表结构和数据量
    const tables = ['universities', 'majors', 'admission_scores'];

    for (const table of tables) {
      const cols = await client.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);

      const count = await client.query(`SELECT COUNT(*) as cnt FROM ${table}`);

      console.log(`\n【${table}】(${count.rows[0].cnt} 条记录)`);
      cols.rows.forEach(r => {
        const defaultStr = r.column_default ? ` DEFAULT ${r.column_default}` : '';
        console.log(`  ${r.column_name}: ${r.data_type}${defaultStr}`);
      });
    }

    // 检查 universities 的 level 字段是数组还是字符串
    const levelCheck = await client.query(`SELECT level FROM universities LIMIT 3`);
    console.log('\nuniversities.level 示例值:', JSON.stringify(levelCheck.rows.map(r => r.level)));

    // 检查 admission_scores 的外键
    const asCheck = await client.query(`SELECT university_id, major_id FROM admission_scores LIMIT 3`);
    console.log('admission_scores 外键示例:', JSON.stringify(asCheck.rows));

  } catch (e) {
    console.error('检查失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();