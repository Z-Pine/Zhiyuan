const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_du5TaptVfsP8@ep-wild-base-a1tvdx19-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyConnection() {
  try {
    console.log('🔌 正在连接数据库...');
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！');
    
    // 检查现有表
    console.log('\n📊 检查现有表...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (result.rows.length === 0) {
      console.log('ℹ️ 数据库为空，需要执行迁移脚本');
    } else {
      console.log(`✅ 发现 ${result.rows.length} 个表:`);
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // 检查数据库版本
    console.log('\n📝 数据库信息:');
    const versionResult = await client.query('SELECT version();');
    console.log(`   ${versionResult.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    
    // 检查当前数据库
    const dbResult = await client.query('SELECT current_database();');
    console.log(`   数据库: ${dbResult.rows[0].current_database}`);
    
    client.release();
    await pool.end();
    
    return { success: true, tableCount: result.rows.length };
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    await pool.end();
    return { success: false, error: error.message };
  }
}

verifyConnection().then(result => {
  if (result.success) {
    console.log('\n✨ 数据库验证完成！');
    process.exit(0);
  } else {
    console.error('\n⚠️ 数据库验证失败！');
    process.exit(1);
  }
});
