/**
 * 导入测试数据脚本
 * 用于快速验证推荐系统功能
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function importTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始导入测试数据...\n');
    
    await client.query('BEGIN');

    // 1. 获取现有的院校和专业ID
    console.log('📋 获取现有数据...');
    const schoolsResult = await client.query('SELECT id, name FROM universities LIMIT 10');
    const majorsResult = await client.query('SELECT id, name, category FROM majors LIMIT 10');
    
    const schools = schoolsResult.rows;
    const majors = majorsResult.rows;
    
    console.log(`   找到 ${schools.length} 所院校`);
    console.log(`   找到 ${majors.length} 个专业\n`);

    if (schools.length === 0 || majors.length === 0) {
      throw new Error('请先运行 seed-data.js 导入基础数据');
    }

    // 2. 导入院校-专业关联数据
    console.log('🔗 导入院校-专业关联数据...');
    let universityMajorCount = 0;
    
    for (const school of schools) {
      // 每所院校随机关联5-8个专业
      const majorCount = 5 + Math.floor(Math.random() * 4);
      const selectedMajors = majors.slice(0, majorCount);
      
      for (const major of selectedMajors) {
        await client.query(`
          INSERT INTO university_majors (
            university_id, major_id, enrollment_plan, tuition_fee
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [
          school.id,
          major.id,
          Math.floor(Math.random() * 50) + 30,  // 30-80人
          Math.floor(Math.random() * 3000) + 5000  // 5000-8000元
        ]);
        universityMajorCount++;
      }
    }
    
    console.log(`   ✅ 导入 ${universityMajorCount} 条院校-专业关联\n`);

    // 3. 导入专业-行业关联数据
    console.log('💼 导入专业-行业关联数据...');
    const industriesResult = await client.query('SELECT id, name FROM industries LIMIT 20');
    const industries = industriesResult.rows;
    
    let majorIndustryCount = 0;
    
    for (const major of majors) {
      // 每个专业关联3-5个行业
      const industryCount = 3 + Math.floor(Math.random() * 3);
      const selectedIndustries = industries
        .sort(() => Math.random() - 0.5)
        .slice(0, industryCount);
      
      for (const industry of selectedIndustries) {
        const relevanceScore = (0.6 + Math.random() * 0.4).toFixed(2);  // 0.6-1.0
        
        await client.query(`
          INSERT INTO major_industries (
            major_id, industry_id, relevance_score
          ) VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [major.id, industry.id, relevanceScore]);
        majorIndustryCount++;
      }
    }
    
    console.log(`   ✅ 导入 ${majorIndustryCount} 条专业-行业关联\n`);

    // 4. 导入录取分数数据（2022-2024年）
    console.log('📊 导入录取分数数据...');
    let admissionScoreCount = 0;
    
    const years = [2022, 2023, 2024];
    const subjectTypes = ['physics', 'history'];
    const batches = ['本科批'];
    
    for (const school of schools) {
      // 获取该院校的专业
      const schoolMajorsResult = await client.query(`
        SELECT major_id FROM university_majors WHERE university_id = $1
      `, [school.id]);
      
      const schoolMajorIds = schoolMajorsResult.rows.map(r => r.major_id);
      
      for (const year of years) {
        for (const subjectType of subjectTypes) {
          // 每个院校每年每个科类录取3-5个专业
          const majorCount = Math.min(3 + Math.floor(Math.random() * 3), schoolMajorIds.length);
          const selectedMajorIds = schoolMajorIds.slice(0, majorCount);
          
          for (const majorId of selectedMajorIds) {
            // 根据年份和科类生成合理的分数
            const baseScore = subjectType === 'physics' ? 550 : 530;
            const yearAdjust = (year - 2022) * 5;  // 每年涨5分
            const randomAdjust = Math.floor(Math.random() * 40) - 20;  // ±20分
            
            const minScore = baseScore + yearAdjust + randomAdjust;
            const minRank = Math.floor(Math.random() * 30000) + 10000;  // 10000-40000
            const planCount = Math.floor(Math.random() * 40) + 20;  // 20-60人
            
            await client.query(`
              INSERT INTO admission_scores (
                university_id, major_id, province, subject_type, year, batch,
                min_score, min_rank, plan_count
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              school.id, majorId, '广东', subjectType, year, batches[0],
              minScore, minRank, planCount
            ]);
            admissionScoreCount++;
          }
        }
      }
    }
    
    console.log(`   ✅ 导入 ${admissionScoreCount} 条录取分数记录\n`);

    await client.query('COMMIT');
    
    // 5. 显示统计信息
    console.log('📈 数据统计:');
    console.log('─'.repeat(60));
    
    const stats = await Promise.all([
      client.query('SELECT COUNT(*) FROM universities'),
      client.query('SELECT COUNT(*) FROM majors'),
      client.query('SELECT COUNT(*) FROM industries'),
      client.query('SELECT COUNT(*) FROM university_majors'),
      client.query('SELECT COUNT(*) FROM major_industries'),
      client.query('SELECT COUNT(*) FROM admission_scores'),
    ]);
    
    console.log(`   院校数量: ${stats[0].rows[0].count}`);
    console.log(`   专业数量: ${stats[1].rows[0].count}`);
    console.log(`   行业数量: ${stats[2].rows[0].count}`);
    console.log(`   院校-专业关联: ${stats[3].rows[0].count}`);
    console.log(`   专业-行业关联: ${stats[4].rows[0].count}`);
    console.log(`   录取分数记录: ${stats[5].rows[0].count}`);
    
    console.log('\n✅ 测试数据导入完成！');
    console.log('\n💡 提示: 现在可以运行 npm test 或 node test-api.js 测试推荐系统');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  importTestData()
    .then(() => {
      console.log('\n🎉 完成！');
      process.exit(0);
    })
    .catch(() => {
      console.error('\n💥 导入失败！');
      process.exit(1);
    });
}

module.exports = { importTestData };
