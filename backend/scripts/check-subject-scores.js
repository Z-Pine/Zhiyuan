const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkSubjectScores() {
  const client = await pool.connect();
  try {
    console.log('查询学生ID为15的详细成绩信息...\n');
    
    // 查询学生基本信息和总分
    const studentResult = await client.query(`
      SELECT 
        id, 
        name, 
        score, 
        rank,
        province,
        subject_type
      FROM students 
      WHERE id = 15
    `);

    if (studentResult.rows.length === 0) {
      console.log('未找到学生信息');
      return;
    }

    const student = studentResult.rows[0];
    console.log('=== 学生基本信息 ===');
    console.log(`ID: ${student.id}`);
    console.log(`姓名: ${student.name}`);
    console.log(`省份: ${student.province}`);
    console.log(`科类: ${student.subject_type === 'physics' ? '物理类' : '历史类'}`);
    console.log(`总分: ${student.score}分`);
    console.log(`排名: 第${student.rank}名`);
    console.log('');

    // 检查是否有scores表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%score%'
    `);

    console.log('=== 数据库中与成绩相关的表 ===');
    if (tablesResult.rows.length === 0) {
      console.log('未找到专门的成绩表');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    console.log('');

    // 检查students表是否有各科成绩字段
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'students'
      AND (
        column_name LIKE '%score%' 
        OR column_name LIKE '%chinese%'
        OR column_name LIKE '%math%'
        OR column_name LIKE '%english%'
        OR column_name LIKE '%subject%'
      )
      ORDER BY ordinal_position
    `);

    console.log('=== students表中与成绩相关的字段 ===');
    if (columnsResult.rows.length === 0) {
      console.log('students表中只有总分(score)字段，没有各科成绩字段');
    } else {
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    console.log('');

    // 如果有scores表，查询详细成绩
    if (tablesResult.rows.some(row => row.table_name === 'scores')) {
      console.log('=== 查询scores表中的详细成绩 ===');
      const scoresResult = await client.query(`
        SELECT * FROM scores WHERE student_id = 15
      `);
      
      if (scoresResult.rows.length === 0) {
        console.log('scores表中没有该学生的成绩记录');
      } else {
        scoresResult.rows.forEach((score, index) => {
          console.log(`\n成绩记录 ${index + 1}:`);
          Object.keys(score).forEach(key => {
            console.log(`  ${key}: ${score[key]}`);
          });
        });
      }
    }

    console.log('\n=== 结论 ===');
    console.log('当前数据库设计：');
    console.log('  - students表只存储总分(score)和排名(rank)');
    console.log('  - 各科成绩需要存储在单独的scores表中');
    console.log('  - 或者在students表中添加各科成绩字段');

  } catch (e) {
    console.error('查询失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSubjectScores();
