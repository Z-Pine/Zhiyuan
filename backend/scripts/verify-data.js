/**
 * 数据验证脚本
 * 检查导入的数据是否完整、正确
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../src/config/database');

const verifyData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('🔍 数据完整性验证');
    console.log('========================================\n');
    
    // 1. 验证院校数据
    console.log('📚 院校数据验证:');
    const schoolsCount = await client.query('SELECT COUNT(*) as count FROM schools');
    const schools985 = await client.query('SELECT COUNT(*) as count FROM schools WHERE is_985 = true');
    const schools211 = await client.query('SELECT COUNT(*) as count FROM schools WHERE is_211 = true');
    const schoolsDoubleFirst = await client.query('SELECT COUNT(*) as count FROM schools WHERE is_double_first = true');
    
    console.log(`  - 总院校数: ${schoolsCount.rows[0].count}`);
    console.log(`  - 985院校: ${schools985.rows[0].count}`);
    console.log(`  - 211院校: ${schools211.rows[0].count}`);
    console.log(`  - 双一流: ${schoolsDoubleFirst.rows[0].count}`);
    
    // 2. 验证专业数据
    console.log('\n📖 专业数据验证:');
    const majorsCount = await client.query('SELECT COUNT(*) as count FROM majors');
    const majorCategories = await client.query('SELECT category, COUNT(*) as count FROM majors GROUP BY category ORDER BY count DESC');
    
    console.log(`  - 总专业数: ${majorsCount.rows[0].count}`);
    console.log('  - 专业类别分布:');
    majorCategories.rows.slice(0, 10).forEach(row => {
      console.log(`    · ${row.category}: ${row.count}个`);
    });
    
    // 3. 验证分数线数据
    console.log('\n📊 分数线数据验证:');
    const scoresCount = await client.query('SELECT COUNT(*) as count FROM admission_scores');
    const scoresByYear = await client.query('SELECT year, COUNT(*) as count FROM admission_scores GROUP BY year ORDER BY year');
    const scoresByProvince = await client.query('SELECT province, COUNT(*) as count FROM admission_scores GROUP BY province ORDER BY count DESC');
    
    console.log(`  - 总分数线记录: ${scoresCount.rows[0].count}`);
    console.log('  - 年份分布:');
    scoresByYear.rows.forEach(row => {
      console.log(`    · ${row.year}年: ${row.count}条`);
    });
    console.log('  - 省份分布(前5):');
    scoresByProvince.rows.slice(0, 5).forEach(row => {
      console.log(`    · ${row.province}: ${row.count}条`);
    });
    
    // 4. 验证数据关联性
    console.log('\n🔗 数据关联性验证:');
    const orphanScores = await client.query(`
      SELECT COUNT(*) as count FROM admission_scores a
      LEFT JOIN schools s ON a.school_id = s.id
      WHERE s.id IS NULL
    `);
    console.log(`  - 无效院校关联: ${orphanScores.rows[0].count}条`);
    
    // 5. 验证关键字段完整性
    console.log('\n✅ 关键字段完整性:');
    const schoolsWithCode = await client.query('SELECT COUNT(*) as count FROM schools WHERE code IS NOT NULL');
    const majorsWithCode = await client.query('SELECT COUNT(*) as count FROM majors WHERE code IS NOT NULL');
    const scoresWithMinScore = await client.query('SELECT COUNT(*) as count FROM admission_scores WHERE min_score IS NOT NULL');
    
    console.log(`  - 院校代码完整率: ${schoolsWithCode.rows[0].count}/${schoolsCount.rows[0].count}`);
    console.log(`  - 专业代码完整率: ${majorsWithCode.rows[0].count}/${majorsCount.rows[0].count}`);
    console.log(`  - 分数线完整率: ${scoresWithMinScore.rows[0].count}/${scoresCount.rows[0].count}`);
    
    // 6. 数据质量检查
    console.log('\n📈 数据质量检查:');
    const scoreRange = await client.query(`
      SELECT 
        MIN(min_score) as min_score,
        MAX(min_score) as max_score,
        AVG(min_score)::INTEGER as avg_score
      FROM admission_scores
    `);
    console.log(`  - 分数线范围: ${scoreRange.rows[0].min_score} - ${scoreRange.rows[0].max_score}`);
    console.log(`  - 平均分数线: ${scoreRange.rows[0].avg_score}`);
    
    console.log('\n========================================');
    console.log('✅ 数据验证完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 数据验证失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

verifyData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
