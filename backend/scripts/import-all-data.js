/**
 * 统一数据导入脚本
 * 导入院校、专业、分数线等基础数据
 */

const { importSchools } = require('./crawl-schools');
const { importMajors } = require('./crawl-majors');
const { generateScores } = require('./generate-scores');

const runImport = async () => {
  console.log('========================================');
  console.log('🎓 志愿填报助手 - 基础数据导入');
  console.log('========================================\n');
  
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
