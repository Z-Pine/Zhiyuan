/**
 * 调试位次分层算法
 */

require('dotenv').config();
const { Pool } = require('pg');
const { calculateScoreLevel } = require('../src/services/recommendation/score-level-algorithm');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function debugScoreLevel() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 调试位次分层算法\n');
    
    // 1. 获取录取分数数据
    const result = await client.query(`
      SELECT 
        a.*,
        s.name as school_name,
        s.is_985, s.is_211
      FROM admission_scores a
      JOIN universities s ON a.university_id = s.id
      WHERE a.province = '广东' AND a.subject_type = 'physics'
      ORDER BY a.min_score DESC
      LIMIT 20
    `);
    
    console.log(`📊 录取分数数据: ${result.rows.length} 条`);
    console.log('\n前5条数据:');
    result.rows.slice(0, 5).forEach((row, i) => {
      console.log(`${i+1}. ${row.school_name}: ${row.min_score}分, 位次${row.min_rank}`);
      console.log(`   university_id: ${row.university_id} (${typeof row.university_id})`);
    });
    
    // 2. 获取所有录取分数
    const allScores = await client.query(`
      SELECT 
        a.*,
        s.name as school_name,
        s.is_985, s.is_211
      FROM admission_scores a
      JOIN universities s ON a.university_id = s.id
      WHERE a.province = '广东' AND a.subject_type = 'physics'
    `);
    
    console.log(`\n📈 总录取分数记录: ${allScores.rows.length} 条`);
    
    // 3. 运行位次分层算法
    console.log('\n🚀 运行位次分层算法...\n');
    const levelResult = await calculateScoreLevel({
      score: 620,
      rank: 15000,
      province: '广东',
      subjectType: 'physics',
      admissionScores: allScores.rows
    });
    
    console.log('\n✅ 分层结果:');
    console.log('─'.repeat(80));
    console.log(`冲刺: ${levelResult.冲刺.length} 所`);
    console.log(`稳妥: ${levelResult.稳妥.length} 所`);
    console.log(`保底: ${levelResult.保底.length} 所`);
    
    if (levelResult.details) {
      console.log('\n详细信息:');
      
      if (levelResult.details.冲刺.length > 0) {
        console.log('\n冲刺院校:');
        levelResult.details.冲刺.slice(0, 3).forEach((item, i) => {
          console.log(`${i+1}. ${item.school_name} (ID: ${item.school_id})`);
          console.log(`   匹配分: ${item.match_score?.toFixed(2)}, 录取概率: ${(item.admission_probability * 100).toFixed(1)}%`);
        });
      }
      
      if (levelResult.details.稳妥.length > 0) {
        console.log('\n稳妥院校:');
        levelResult.details.稳妥.slice(0, 3).forEach((item, i) => {
          console.log(`${i+1}. ${item.school_name} (ID: ${item.school_id})`);
          console.log(`   匹配分: ${item.match_score?.toFixed(2)}, 录取概率: ${(item.admission_probability * 100).toFixed(1)}%`);
        });
      }
      
      if (levelResult.details.保底.length > 0) {
        console.log('\n保底院校:');
        levelResult.details.保底.slice(0, 3).forEach((item, i) => {
          console.log(`${i+1}. ${item.school_name} (ID: ${item.school_id})`);
          console.log(`   匹配分: ${item.match_score?.toFixed(2)}, 录取概率: ${(item.admission_probability * 100).toFixed(1)}%`);
        });
      }
    }
    
    console.log('\n阈值信息:');
    console.log(JSON.stringify(levelResult.thresholds, null, 2));
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

debugScoreLevel();
