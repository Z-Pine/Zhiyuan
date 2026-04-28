const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function addSubjectScoresFields() {
  const client = await pool.connect();
  try {
    console.log('开始添加各科成绩字段到students表...\n');
    
    // 使用JSONB字段存储各科成绩，更灵活
    const checkSubjectScores = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students' AND column_name = 'subject_scores'
    `);

    if (checkSubjectScores.rows.length === 0) {
      await client.query(`
        ALTER TABLE students 
        ADD COLUMN subject_scores JSONB
      `);
      console.log('✅ 成功添加subject_scores字段（JSONB类型）');
      
      await client.query(`
        COMMENT ON COLUMN students.subject_scores IS '各科成绩JSON: {chinese, math, english, subject1, subject2, subject3}';
      `);
      console.log('✅ 添加字段注释');
    } else {
      console.log('ℹ️  subject_scores字段已存在');
    }

    console.log('\n✨ 数据库迁移完成！');
    console.log('\n当前students表结构（成绩相关字段）:');
    
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'students'
      AND (column_name LIKE '%score%' OR column_name = 'rank')
      ORDER BY ordinal_position
    `);

    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(必填)' : '(可选)'}`);
    });

    // 示例数据结构
    console.log('\n📝 各科成绩JSON格式示例:');
    console.log(`{
  "chinese": 120,
  "math": 135,
  "english": 130,
  "subject1": 85,
  "subject2": 90,
  "subject3": 88
}`);

  } catch (e) {
    console.error('❌ 迁移失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addSubjectScoresFields();
