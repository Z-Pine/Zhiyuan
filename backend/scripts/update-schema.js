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
    console.log('开始更新数据库表结构...\n');
    
    // 更新 universities 表
    console.log('更新 universities 表...');
    await client.query(`
      ALTER TABLE universities 
      ADD COLUMN IF NOT EXISTS is_985 BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_211 BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_double_first BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS rank INTEGER,
      ADD COLUMN IF NOT EXISTS website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS logo_url TEXT,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
    `);
    
    // 更新 majors 表
    console.log('更新 majors 表...');
    await client.query(`
      ALTER TABLE majors 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
    `);
    
    // 更新 users 表
    console.log('更新 users 表...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
    `);
    
    console.log('\n✅ 数据库表结构更新完成！');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  updateSchema()
    .then(() => {
      console.log('\n🎉 表结构更新成功！');
      process.exit(0);
    })
    .catch(() => {
      console.error('\n💥 表结构更新失败！');
      process.exit(1);
    });
}

module.exports = { updateSchema };
