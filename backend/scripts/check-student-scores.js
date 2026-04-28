const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkStudentScores() {
  const client = await pool.connect();
  try {
    console.log('查询用户ID为13的学生成绩信息...\n');
    
    const result = await client.query(`
      SELECT 
        id, 
        name, 
        gender,
        province, 
        subject_type,
        score, 
        rank,
        city,
        high_school,
        created_at,
        updated_at
      FROM students 
      WHERE user_id = 13 
      ORDER BY updated_at DESC 
      LIMIT 10
    `);

    if (result.rows.length === 0) {
      console.log('未找到学生信息');
    } else {
      console.log(`找到 ${result.rows.length} 条学生记录:\n`);
      result.rows.forEach((student, index) => {
        console.log(`--- 学生 ${index + 1} ---`);
        console.log(`ID: ${student.id}`);
        console.log(`姓名: ${student.name}`);
        console.log(`性别: ${student.gender === 'male' ? '男' : '女'}`);
        console.log(`省份: ${student.province}`);
        console.log(`城市: ${student.city || '未填写'}`);
        console.log(`高中: ${student.high_school || '未填写'}`);
        console.log(`科类: ${student.subject_type === 'physics' ? '物理类' : '历史类'}`);
        console.log(`总分: ${student.score !== null ? student.score + '分' : '未填写'}`);
        console.log(`排名: ${student.rank !== null ? '第' + student.rank + '名' : '未填写'}`);
        console.log(`创建时间: ${new Date(student.created_at).toLocaleString('zh-CN')}`);
        console.log(`更新时间: ${new Date(student.updated_at).toLocaleString('zh-CN')}`);
        console.log('');
      });

      // 统计有成绩的学生
      const withScores = result.rows.filter(s => s.score !== null);
      console.log(`\n统计: 共 ${result.rows.length} 个学生，其中 ${withScores.length} 个已录入成绩`);
      
      if (withScores.length > 0) {
        console.log('\n已录入成绩的学生:');
        withScores.forEach(s => {
          console.log(`  - ${s.name}: ${s.score}分, 排名第${s.rank}名`);
        });
      }
    }

  } catch (e) {
    console.error('查询失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStudentScores();
