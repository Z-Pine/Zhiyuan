const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  const client = await pool.connect();
  try {
    const universities = await client.query('SELECT COUNT(*) as cnt FROM universities');
    const majors = await client.query('SELECT COUNT(*) as cnt FROM majors');
    const scores = await client.query('SELECT COUNT(*) as cnt FROM admission_scores');

    console.log('universities:', universities.rows[0].cnt);
    console.log('majors:', majors.rows[0].cnt);
    console.log('admission_scores:', scores.rows[0].cnt);

    // 按年份统计
    if (parseInt(scores.rows[0].cnt) > 0) {
      const byYear = await client.query(`
        SELECT year, subject_type, COUNT(*) as cnt
        FROM admission_scores
        GROUP BY year, subject_type
        ORDER BY year, subject_type
      `);
      console.log('\n分数线按年份/科类分布:');
      byYear.rows.forEach(r => {
        console.log(`  ${r.year}年 ${r.subject_type}: ${r.cnt}条`);
      });

      // 按省份统计
      const byProvince = await client.query(`
        SELECT province, COUNT(*) as cnt
        FROM admission_scores
        GROUP BY province
        ORDER BY cnt DESC
      `);
      console.log('\n分数线按省份分布:');
      byProvince.rows.forEach(r => {
        console.log(`  ${r.province}: ${r.cnt}条`);
      });

      // 示例数据
      const sample = await client.query(`
        SELECT u.name as school, m.name as major, a.province, a.year, a.subject_type, a.min_score
        FROM admission_scores a
        JOIN universities u ON a.university_id = u.id
        JOIN majors m ON a.major_id = m.id
        LIMIT 5
      `);
      console.log('\n示例数据:');
      sample.rows.forEach(r => {
        console.log(`  ${r.year} ${r.province} ${r.subject_type} ${r.school} ${r.major}: ${r.min_score}分`);
      });
    }

  } catch (e) {
    console.error('检查失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkData();