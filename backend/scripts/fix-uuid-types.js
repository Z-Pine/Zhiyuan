/**
 * 修复UUID类型不匹配问题
 * 将university_majors和admission_scores表的university_id改为UUID类型
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function fixUuidTypes() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 开始修复UUID类型不匹配问题...\n');
    
    await client.query('BEGIN');

    // 1. 检查universities表的id类型
    console.log('📋 检查表结构...');
    const universityIdType = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'universities' AND column_name = 'id'
    `);
    console.log(`   universities.id 类型: ${universityIdType.rows[0]?.data_type || '未知'}`);

    // 2. 修改university_majors表
    console.log('\n🔄 修改 university_majors 表...');
    
    // 删除现有数据（如果有）
    const umCount = await client.query('SELECT COUNT(*) FROM university_majors');
    console.log(`   当前记录数: ${umCount.rows[0].count}`);
    await client.query('DELETE FROM university_majors');
    console.log('   清空现有数据');
    
    // 修改字段类型
    await client.query(`
      ALTER TABLE university_majors 
      ALTER COLUMN university_id TYPE UUID USING NULL
    `);
    console.log('   ✅ university_id 改为 UUID 类型');
    
    await client.query(`
      ALTER TABLE university_majors 
      ALTER COLUMN major_id TYPE UUID USING NULL
    `);
    console.log('   ✅ major_id 改为 UUID 类型');

    // 3. 检查admission_scores表（可能已经是UUID）
    console.log('\n🔄 检查 admission_scores 表...');
    const asUnivType = await client.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'admission_scores' AND column_name = 'university_id'
    `);
    
    if (asUnivType.rows[0]?.data_type !== 'uuid') {
      const asCount = await client.query('SELECT COUNT(*) FROM admission_scores');
      console.log(`   当前记录数: ${asCount.rows[0].count}`);
      await client.query('DELETE FROM admission_scores');
      console.log('   清空现有数据');
      
      await client.query(`
        ALTER TABLE admission_scores 
        ALTER COLUMN university_id TYPE UUID USING NULL
      `);
      console.log('   ✅ university_id 改为 UUID 类型');
      
      await client.query(`
        ALTER TABLE admission_scores 
        ALTER COLUMN major_id TYPE UUID USING NULL
      `);
      console.log('   ✅ major_id 改为 UUID 类型');
    } else {
      console.log('   ✅ admission_scores 表已经是 UUID 类型');
    }

    // 4. 修改major_industries表
    console.log('\n🔄 修改 major_industries 表...');
    const miCount = await client.query('SELECT COUNT(*) FROM major_industries');
    console.log(`   当前记录数: ${miCount.rows[0].count}`);
    await client.query('DELETE FROM major_industries');
    console.log('   清空现有数据');
    
    await client.query(`
      ALTER TABLE major_industries 
      ALTER COLUMN major_id TYPE UUID USING NULL
    `);
    console.log('   ✅ major_id 改为 UUID 类型');

    await client.query('COMMIT');
    
    console.log('\n✅ UUID类型修复完成！');
    console.log('\n💡 提示: 现在可以运行 import-test-data.js 导入测试数据');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 错误:', error.message);
    console.error('\n详细信息:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  fixUuidTypes()
    .then(() => {
      console.log('\n🎉 完成！');
      process.exit(0);
    })
    .catch(() => {
      console.error('\n💥 修复失败！');
      process.exit(1);
    });
}

module.exports = { fixUuidTypes };
