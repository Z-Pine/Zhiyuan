/**
 * 统一数据导入脚本
 * 导入院校、专业、分数线等基础数据
 */

const { importSchools } = require('./crawl-schools');
const { importMajors } = require('./crawl-majors');
const { generateScores } = require('./generate-scores');
const { pool } = require('../src/config/database');

const runImport = async () => {
  console.log('========================================');
  console.log('🎓 志愿填报助手 - 基础数据导入');
  console.log('========================================\n');
  
  // 前置检查：验证数据库连接
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT current_database()');
    console.log(`✅ 数据库连接正常: ${result.rows[0].current_database}\n`);
    client.release();
  } catch (error) {
    console.error('❌ 数据库连接失败，请先执行 migrate-prod.sql 创建表结构');
    console.error('   运行命令: psql $DATABASE_URL -f database/migrate-prod.sql\n');
    console.error('   错误信息:', error.message);
    process.exit(1);
  }
  
  // 前置检查：确认关键表已创建
  try {
    const client = await pool.connect();
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('universities', 'majors', 'admission_scores')
    `);
    const existingTables = tablesResult.rows.map(r => r.table_name);
    const requiredTables = ['universities', 'majors', 'admission_scores'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.error(`❌ 缺少必要的表: ${missingTables.join(', ')}`);
      console.error('   请先执行数据库迁移: psql $DATABASE_URL -f database/migrate-prod.sql\n');
      process.exit(1);
    }
    client.release();
  } catch (error) {
    console.error('❌ 表结构检查失败:', error.message);
    process.exit(1);
  }
  
  try {
    // 1. 导入院校数据
    console.log('📚 步骤 1/3: 导入院校数据...');
    await importSchools();
    console.log('');
    
    // 2. 导入专业数据
    console.log('📖 步骤 2/3: 导入专业数据...');
    await importMajors();
    console.log('');
    
    // 3. 生成分数线数据
    console.log('📊 步骤 3/3: 生成分数线数据...');
    await generateScores();
    console.log('');
    
    console.log('========================================');
    console.log('✅ 所有基础数据导入完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 数据导入失败:', error.message);
    process.exit(1);
  }
};

runImport();
