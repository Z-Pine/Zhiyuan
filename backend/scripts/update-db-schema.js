/**
 * 更新数据库表结构
 * 添加缺失的字段
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const updateSchema = async () => {
  const client = await pool.connect();
  
  try {
    console.log('开始更新数据库表结构...');
    await client.query('BEGIN');
    
    // 检查并添加 schools 表的字段
    const schoolsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'schools'
    `);
    
    const schoolColumnNames = schoolsColumns.rows.map(r => r.column_name);
    console.log('现有 schools 字段:', schoolColumnNames);
    
    if (!schoolColumnNames.includes('is_985')) {
      await client.query(`ALTER TABLE schools ADD COLUMN is_985 BOOLEAN DEFAULT FALSE`);
      console.log('✓ 添加 is_985 字段');
    }
    
    if (!schoolColumnNames.includes('is_211')) {
      await client.query(`ALTER TABLE schools ADD COLUMN is_211 BOOLEAN DEFAULT FALSE`);
      console.log('✓ 添加 is_211 字段');
    }
    
    if (!schoolColumnNames.includes('is_double_first')) {
      await client.query(`ALTER TABLE schools ADD COLUMN is_double_first BOOLEAN DEFAULT FALSE`);
      console.log('✓ 添加 is_double_first 字段');
    }
    
    // 检查并添加 majors 表的字段
    const majorsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'majors'
    `);
    
    const majorColumnNames = majorsColumns.rows.map(r => r.column_name);
    console.log('现有 majors 字段:', majorColumnNames);
    
    if (!majorColumnNames.includes('degree_type')) {
      await client.query(`ALTER TABLE majors ADD COLUMN degree_type VARCHAR(50)`);
      console.log('✓ 添加 degree_type 字段');
    }
    
    // 创建 admission_scores 表（如果不存在）
    await client.query(`
      CREATE TABLE IF NOT EXISTS admission_scores (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        major_id INTEGER REFERENCES majors(id) ON DELETE CASCADE,
        province VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        subject_type VARCHAR(20) NOT NULL,
        min_score INTEGER,
        min_rank INTEGER,
        plan_count INTEGER,
        batch VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(school_id, major_id, province, year, subject_type)
      )
    `);
    console.log('✓ admission_scores 表创建/检查完成');
    
    await client.query('COMMIT');
    console.log('\n✅ 数据库表结构更新完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('数据库表结构更新失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

updateSchema()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
