const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://neondb_owner:npg_du5TaptVfsP8@ep-wild-base-a1tvdx19-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始执行数据库迁移...\n');
    
    // 读取迁移脚本
    const migrationPath = path.join(__dirname, '..', 'database', 'migrate-prod.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // 分割SQL语句（按分号分割，但忽略注释中的分号）
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📋 共 ${statements.length} 个SQL语句需要执行\n`);
    
    // 执行每个语句
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const shortDesc = statement.substring(0, 50).replace(/\s+/g, ' ');
      
      try {
        await client.query(statement);
        successCount++;
        process.stdout.write(`✅ [${i + 1}/${statements.length}] ${shortDesc}...\n`);
      } catch (error) {
        errorCount++;
        // 忽略 "已经存在" 的错误
        if (error.message.includes('already exists')) {
          process.stdout.write(`⚠️  [${i + 1}/${statements.length}] ${shortDesc} (已存在)\n`);
        } else {
          process.stdout.write(`❌ [${i + 1}/${statements.length}] ${shortDesc}\n`);
          console.error(`   错误: ${error.message}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 迁移结果统计');
    console.log('='.repeat(50));
    console.log(`✅ 成功: ${successCount}`);
    console.log(`⚠️  跳过: ${errorCount}`);
    console.log(`📈 总计: ${statements.length}`);
    
    // 验证表是否创建成功
    console.log('\n🔍 验证表结构...');
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`\n📋 已创建 ${tableResult.rows.length} 个表:`);
    tableResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    // 验证索引
    console.log('\n🔍 验证索引...');
    const indexResult = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    
    console.log(`\n📋 已创建 ${indexResult.rows.length} 个索引`);
    
    // 验证触发器
    console.log('\n🔍 验证触发器...');
    const triggerResult = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table;
    `);
    
    console.log(`\n📋 已创建 ${triggerResult.rows.length} 个触发器`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ 数据库迁移完成！');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error(error);
  process.exit(1);
});
