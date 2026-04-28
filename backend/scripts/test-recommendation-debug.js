/**
 * 推荐系统调试脚本
 * 直接测试推荐引擎，查看详细日志
 */

require('dotenv').config();
const { Pool } = require('pg');
const { RecommendationEngine } = require('../src/services/recommendation/index');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testRecommendation() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 开始测试推荐引擎...\n');
    
    // 1. 获取测试学生数据
    const studentResult = await client.query(`
      SELECT * FROM students WHERE id = 5
    `);
    
    if (studentResult.rows.length === 0) {
      throw new Error('找不到测试学生');
    }
    
    const student = studentResult.rows[0];
    console.log('📋 学生信息:', student);
    
    // 2. 获取学生画像
    const profileResult = await client.query(`
      SELECT * FROM student_profiles WHERE student_id = $1
    `, [student.id]);
    
    const profile = profileResult.rows[0] || {
      id: null,
      student_id: student.id,
      user_id: student.user_id,
      mbti_type: 'INTJ',
      holland_code: 'RIA',
      interests: ['计算机', '人工智能'],
      career_preferences: ['软件工程师'],
      risk_preference: 'moderate'
    };
    
    console.log('🎨 学生画像:', profile);
    
    // 3. 获取考试成绩
    const examResult = await client.query(`
      SELECT * FROM exam_results WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [student.id]);
    
    if (examResult.rows.length === 0) {
      throw new Error('找不到考试成绩');
    }
    
    const exam = examResult.rows[0];
    console.log('📊 考试成绩:', exam);
    
    // 4. 检查录取分数数据
    const admissionCount = await client.query(`
      SELECT COUNT(*) as count FROM admission_scores 
      WHERE province = $1 AND subject_type = $2
    `, [exam.province, exam.subject_type]);
    
    console.log(`\n📈 录取分数数据: ${admissionCount.rows[0].count} 条`);
    
    // 5. 查看部分录取分数数据
    const sampleScores = await client.query(`
      SELECT 
        a.*,
        s.name as school_name,
        m.name as major_name
      FROM admission_scores a
      LEFT JOIN universities s ON a.university_id = s.id
      LEFT JOIN majors m ON a.major_id = m.id
      WHERE a.province = $1 AND a.subject_type = $2
      LIMIT 5
    `, [exam.province, exam.subject_type]);
    
    console.log('\n📋 录取分数样本:');
    sampleScores.rows.forEach(row => {
      console.log(`  - ${row.school_name || '未知院校'} / ${row.major_name || '未知专业'}: ${row.min_score}分 (位次${row.min_rank})`);
    });
    
    // 6. 运行推荐引擎
    console.log('\n🚀 开始生成推荐...\n');
    const engine = new RecommendationEngine();
    const result = await engine.generateRecommendation(profile, exam);
    
    console.log('\n✅ 推荐结果:');
    console.log('─'.repeat(80));
    console.log(`冲刺院校: ${result.冲刺院校?.length || 0} 所`);
    console.log(`稳妥院校: ${result.稳妥院校?.length || 0} 所`);
    console.log(`保底院校: ${result.保底院校?.length || 0} 所`);
    
    if (result.冲刺院校?.length > 0) {
      console.log('\n冲刺院校详情:');
      result.冲刺院校.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.school?.name || '未知'} - 录取概率: ${(item.admissionProbability * 100).toFixed(1)}%`);
      });
    }
    
    if (result.稳妥院校?.length > 0) {
      console.log('\n稳妥院校详情:');
      result.稳妥院校.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.school?.name || '未知'} - 录取概率: ${(item.admissionProbability * 100).toFixed(1)}%`);
      });
    }
    
    if (result.保底院校?.length > 0) {
      console.log('\n保底院校详情:');
      result.保底院校.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.school?.name || '未知'} - 录取概率: ${(item.admissionProbability * 100).toFixed(1)}%`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

testRecommendation();
