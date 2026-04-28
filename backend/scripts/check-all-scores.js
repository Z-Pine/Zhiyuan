const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkAllScores() {
  const client = await pool.connect();
  try {
    console.log('查询用户ID为13的学生完整成绩信息...\n');
    
    const result = await client.query(`
      SELECT 
        id, 
        name, 
        province,
        subject_type,
        score, 
        rank,
        subject_scores,
        updated_at
      FROM students 
      WHERE user_id = 13 
      AND score IS NOT NULL
      ORDER BY updated_at DESC 
      LIMIT 5
    `);

    if (result.rows.length === 0) {
      console.log('未找到已录入成绩的学生');
    } else {
      console.log(`找到 ${result.rows.length} 个已录入成绩的学生:\n`);
      
      result.rows.forEach((student, index) => {
        console.log(`${'='.repeat(60)}`);
        console.log(`学生 ${index + 1}`);
        console.log(`${'='.repeat(60)}`);
        console.log(`ID: ${student.id}`);
        console.log(`姓名: ${student.name}`);
        console.log(`省份: ${student.province}`);
        console.log(`科类: ${student.subject_type === 'physics' ? '物理类' : '历史类'}`);
        console.log(`\n📊 成绩信息:`);
        console.log(`  总分: ${student.score}分`);
        console.log(`  排名: 第${student.rank}名`);
        
        if (student.subject_scores) {
          console.log(`\n📝 各科成绩:`);
          const scores = student.subject_scores;
          if (scores.chinese) console.log(`  语文: ${scores.chinese}分`);
          if (scores.math) console.log(`  数学: ${scores.math}分`);
          if (scores.english) console.log(`  英语: ${scores.english}分`);
          if (scores.subject1) console.log(`  选科1: ${scores.subject1}分`);
          if (scores.subject2) console.log(`  选科2: ${scores.subject2}分`);
          if (scores.subject3) console.log(`  选科3: ${scores.subject3}分`);
          
          // 验证总分
          const calculatedTotal = (scores.chinese || 0) + (scores.math || 0) + 
                                  (scores.english || 0) + (scores.subject1 || 0) + 
                                  (scores.subject2 || 0) + (scores.subject3 || 0);
          console.log(`\n✅ 各科成绩合计: ${calculatedTotal}分`);
          if (calculatedTotal === student.score) {
            console.log(`✅ 总分验证通过！`);
          } else {
            console.log(`⚠️  总分不匹配！录入总分: ${student.score}分, 计算总分: ${calculatedTotal}分`);
          }
        } else {
          console.log(`\n⚠️  未录入各科成绩`);
        }
        
        console.log(`\n更新时间: ${new Date(student.updated_at).toLocaleString('zh-CN')}`);
        console.log('');
      });
    }

  } catch (e) {
    console.error('查询失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllScores();
