const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function addScoreRankFields() {
  const client = await pool.connect();
  try {
    console.log('开始添加score和rank字段到students表...\n');
    
    // 检查字段是否已存在
    const checkScore = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students' AND column_name = 'score'
    `);
    
    const checkRank = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students' AND column_name = 'rank'
    `);

    // 添加score字段
    if (checkScore.rows.length === 0) {
      await client.query(`
        ALTER TABLE students 
        ADD COLUMN score INTEGER
      `);
      console.log('✅ 成功添加score字段（高考总分）');
    } else {
      console.log('ℹ️  score字段已存在');
    }

    // 添加rank字段
    if (checkRank.rows.length === 0) {
      await client.query(`
        ALTER TABLE students 
        ADD COLUMN rank INTEGER
      `);
      console.log('✅ 成功添加rank字段（省排名）');
    } else {
      console.log('ℹ️  rank字段已存在');
    }

    // 添加约束和注释
    await client.query(`
      COMMENT ON COLUMN students.score IS '高考总分(0-750)';
      COMMENT ON COLUMN students.rank IS '省排名';
    `);
    console.log('✅ 添加字段注释');

    console.log('\n✨ 数据库迁移完成！');
    console.log('\n当前students表结构:');
    
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'students'
      ORDER BY ordinal_position
    `);

    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(必填)' : '(可选)'}`);
    });

  } catch (e) {
    console.error('❌ 迁移失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addScoreRankFields();
