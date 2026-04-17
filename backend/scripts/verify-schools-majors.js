/**
 * 院校和专业数据详细验证脚本
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../src/config/database');

const verifyData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('🔍 院校和专业数据详细验证');
    console.log('========================================\n');
    
    // 1. 院校总体统计
    console.log('📚 【院校数据概览】');
    const schoolsTotal = await client.query('SELECT COUNT(*) as count FROM schools');
    console.log(`总院校数: ${schoolsTotal.rows[0].count} 所\n`);
    
    // 2. 按层次统计
    console.log('📊 按层次分布:');
    const byLevel = await client.query(`
      SELECT level, COUNT(*) as count 
      FROM schools 
      GROUP BY level 
      ORDER BY count DESC
    `);
    byLevel.rows.forEach(row => {
      console.log(`  ${row.level}: ${row.count} 所`);
    });
    
    // 3. 按省份统计
    console.log('\n📍 按省份分布(前10):');
    const byProvince = await client.query(`
      SELECT province, COUNT(*) as count 
      FROM schools 
      GROUP BY province 
      ORDER BY count DESC 
      LIMIT 10
    `);
    byProvince.rows.forEach(row => {
      console.log(`  ${row.province}: ${row.count} 所`);
    });
    
    // 4. 按类别统计
    console.log('\n🏫 按类别分布:');
    const byCategory = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM schools 
      GROUP BY category 
      ORDER BY count DESC
    `);
    byCategory.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} 所`);
    });
    
    // 5. 985/211/双一流统计
    console.log('\n⭐ 重点院校统计:');
    const stats = await client.query(`
      SELECT 
        SUM(CASE WHEN is_985 THEN 1 ELSE 0 END) as c985,
        SUM(CASE WHEN is_211 THEN 1 ELSE 0 END) as c211,
        SUM(CASE WHEN is_double_first THEN 1 ELSE 0 END) as cdouble
      FROM schools
    `);
    console.log(`  985院校: ${stats.rows[0].c985} 所`);
    console.log(`  211院校: ${stats.rows[0].c211} 所`);
    console.log(`  双一流: ${stats.rows[0].cdouble} 所`);
    
    // 6. 显示部分985院校
    console.log('\n🏆 部分985院校示例:');
    const top985 = await client.query(`
      SELECT name, province, city, category 
      FROM schools 
      WHERE is_985 = true 
      ORDER BY name 
      LIMIT 10
    `);
    top985.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.name} (${row.province}${row.city ? '·' + row.city : ''}) - ${row.category}`);
    });
    
    // 7. 专业总体统计
    console.log('\n\n📖 【专业数据概览】');
    const majorsTotal = await client.query('SELECT COUNT(*) as count FROM majors');
    console.log(`总专业数: ${majorsTotal.rows[0].count} 个\n`);
    
    // 8. 按学科门类统计
    console.log('📚 按学科门类分布:');
    const majorCategories = await client.query(`
      SELECT category, COUNT(*) as count,
        STRING_AGG(name, ', ' ORDER BY name) as majors
      FROM majors 
      GROUP BY category 
      ORDER BY count DESC
    `);
    majorCategories.rows.forEach(row => {
      console.log(`\n  【${row.category}】(${row.count}个)`);
      // 只显示前5个专业
      const majorList = row.majors.split(', ').slice(0, 5);
      majorList.forEach((major, i) => {
        console.log(`    ${i+1}. ${major}`);
      });
      if (row.count > 5) {
        console.log(`    ... 等${row.count}个专业`);
      }
    });
    
    // 9. 热门专业检查
    console.log('\n\n🔥 热门专业检查:');
    const hotMajors = ['计算机科学与技术', '软件工程', '人工智能', '临床医学', '金融学'];
    for (const majorName of hotMajors) {
      const result = await client.query(`
        SELECT name, category, degree_type 
        FROM majors 
        WHERE name = $1
      `, [majorName]);
      if (result.rows.length > 0) {
        const m = result.rows[0];
        console.log(`  ✅ ${m.name} - ${m.category} - ${m.degree_type}`);
      } else {
        console.log(`  ❌ ${majorName} - 未找到`);
      }
    }
    
    // 10. 数据完整性检查
    console.log('\n\n✅ 【数据完整性检查】');
    
    // 院校字段完整性
    const schoolFields = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN code IS NOT NULL AND code != '' THEN 1 ELSE 0 END) as has_code,
        SUM(CASE WHEN name IS NOT NULL AND name != '' THEN 1 ELSE 0 END) as has_name,
        SUM(CASE WHEN province IS NOT NULL AND province != '' THEN 1 ELSE 0 END) as has_province,
        SUM(CASE WHEN level IS NOT NULL AND level != '' THEN 1 ELSE 0 END) as has_level
      FROM schools
    `);
    console.log('\n院校字段完整率:');
    console.log(`  代码: ${schoolFields.rows[0].has_code}/${schoolFields.rows[0].total} (${(schoolFields.rows[0].has_code/schoolFields.rows[0].total*100).toFixed(1)}%)`);
    console.log(`  名称: ${schoolFields.rows[0].has_name}/${schoolFields.rows[0].total} (${(schoolFields.rows[0].has_name/schoolFields.rows[0].total*100).toFixed(1)}%)`);
    console.log(`  省份: ${schoolFields.rows[0].has_province}/${schoolFields.rows[0].total} (${(schoolFields.rows[0].has_province/schoolFields.rows[0].total*100).toFixed(1)}%)`);
    console.log(`  层次: ${schoolFields.rows[0].has_level}/${schoolFields.rows[0].total} (${(schoolFields.rows[0].has_level/schoolFields.rows[0].total*100).toFixed(1)}%)`);
    
    // 专业字段完整性
    const majorFields = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN code IS NOT NULL AND code != '' THEN 1 ELSE 0 END) as has_code,
        SUM(CASE WHEN name IS NOT NULL AND name != '' THEN 1 ELSE 0 END) as has_name,
        SUM(CASE WHEN category IS NOT NULL AND category != '' THEN 1 ELSE 0 END) as has_category,
        SUM(CASE WHEN degree_type IS NOT NULL AND degree_type != '' THEN 1 ELSE 0 END) as has_degree
      FROM majors
    `);
    console.log('\n专业字段完整率:');
    console.log(`  代码: ${majorFields.rows[0].has_code}/${majorFields.rows[0].total} (${(majorFields.rows[0].has_code/majorFields.rows[0].total*100).toFixed(1)}%)`);
    console.log(`  名称: ${majorFields.rows[0].has_name}/${majorFields.rows[0].total} (${(majorFields.rows[0].has_name/majorFields.rows[0].total*100).toFixed(1)}%)`);
    console.log(`  类别: ${majorFields.rows[0].has_category}/${majorFields.rows[0].total} (${(majorFields.rows[0].has_category/majorFields.rows[0].total*100).toFixed(1)}%)`);
    console.log(`  学位: ${majorFields.rows[0].has_degree}/${majorFields.rows[0].total} (${(majorFields.rows[0].has_degree/majorFields.rows[0].total*100).toFixed(1)}%)`);
    
    console.log('\n========================================');
    console.log('✅ 数据验证完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

verifyData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
