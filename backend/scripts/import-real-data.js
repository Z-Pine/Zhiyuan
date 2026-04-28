/**
 * 导入真实录取数据
 * 从CSV文件导入2022-2024年广东省录取数据
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * 解析CSV文件
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim();
    });
    data.push(row);
  }
  
  return data;
}

/**
 * 导入数据
 */
async function importRealData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始导入真实录取数据...\n');
    
    await client.query('BEGIN');
    
    // 1. 清空旧的测试数据
    console.log('🗑️  清空旧的测试数据...');
    await client.query('DELETE FROM admission_scores');
    console.log('   ✅ 已清空 admission_scores 表\n');
    
    // 2. 读取CSV文件
    const dataDir = path.join(__dirname, '../data');
    const files = [
      'real-admission-data-2024.csv',
      'real-admission-data-2023.csv'
    ];
    
    let totalCount = 0;
    const universityMap = new Map(); // 院校代码 -> UUID
    const majorMap = new Map(); // 专业代码 -> UUID
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  文件不存在: ${file}`);
        continue;
      }
      
      console.log(`📄 读取文件: ${file}`);
      const records = parseCSV(filePath);
      console.log(`   找到 ${records.length} 条记录\n`);
      
      // 3. 导入数据
      console.log(`📊 导入数据...`);
      let imported = 0;
      
      for (const record of records) {
        // 每条记录使用独立的savepoint
        try {
          await client.query('SAVEPOINT sp1');
          
          // 3.1 查找或创建院校
          let universityId = universityMap.get(record.university_code);
          if (!universityId) {
            const univResult = await client.query(
              'SELECT id FROM universities WHERE code = $1',
              [record.university_code]
            );
            
            if (univResult.rows.length > 0) {
              universityId = univResult.rows[0].id;
            } else {
              // 创建新院校
              const newUnivResult = await client.query(`
                INSERT INTO universities (code, name, province, type, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
              `, [
                record.university_code,
                record.university_name,
                record.province,
                '综合',
                'active'
              ]);
              universityId = newUnivResult.rows[0].id;
              console.log(`   ➕ 新增院校: ${record.university_name}`);
            }
            universityMap.set(record.university_code, universityId);
          }
          
          // 3.2 查找或创建专业
          let majorId = majorMap.get(record.major_code);
          if (!majorId) {
            const majorResult = await client.query(
              'SELECT id FROM majors WHERE code = $1',
              [record.major_code]
            );
            
            if (majorResult.rows.length > 0) {
              majorId = majorResult.rows[0].id;
            } else {
              // 创建新专业
              const newMajorResult = await client.query(`
                INSERT INTO majors (code, name, category, degree_type, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
              `, [
                record.major_code,
                record.major_name,
                '工学', // 默认分类
                '本科',
                'active'
              ]);
              majorId = newMajorResult.rows[0].id;
              console.log(`   ➕ 新增专业: ${record.major_name}`);
            }
            majorMap.set(record.major_code, majorId);
          }
          
          // 3.3 插入或更新录取分数
          await client.query(`
            INSERT INTO admission_scores (
              university_id, major_id, province, year, subject_type,
              min_score, min_rank, plan_count, batch, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (university_id, major_id, province, year, subject_type)
            DO UPDATE SET
              min_score = EXCLUDED.min_score,
              min_rank = EXCLUDED.min_rank,
              plan_count = EXCLUDED.plan_count,
              batch = EXCLUDED.batch
          `, [
            universityId,
            majorId,
            record.province,
            parseInt(record.year),
            record.subject_type,
            parseInt(record.min_score),
            parseInt(record.min_rank),
            parseInt(record.plan_count),
            record.batch
          ]);
          
          imported++;
          totalCount++;
          await client.query('RELEASE SAVEPOINT sp1');
          
        } catch (error) {
          await client.query('ROLLBACK TO SAVEPOINT sp1');
          console.error(`   ❌ 导入失败: ${record.university_name} - ${record.major_name}`);
          console.error(`      错误: ${error.message}`);
        }
      }
      
      console.log(`   ✅ 成功导入 ${imported} 条记录\n`);
    }
    
    await client.query('COMMIT');
    
    // 4. 显示统计信息
    console.log('📈 数据统计:');
    console.log('─'.repeat(80));
    
    const stats = await Promise.all([
      client.query('SELECT COUNT(*) FROM universities'),
      client.query('SELECT COUNT(*) FROM majors'),
      client.query('SELECT COUNT(*) FROM admission_scores'),
      client.query(`
        SELECT COUNT(DISTINCT university_id) as univ_count,
               COUNT(DISTINCT major_id) as major_count,
               MIN(year) as min_year,
               MAX(year) as max_year
        FROM admission_scores
      `)
    ]);
    
    console.log(`   院校总数: ${stats[0].rows[0].count}`);
    console.log(`   专业总数: ${stats[1].rows[0].count}`);
    console.log(`   录取分数记录: ${stats[2].rows[0].count}`);
    console.log(`   涉及院校: ${stats[3].rows[0].univ_count} 所`);
    console.log(`   涉及专业: ${stats[3].rows[0].major_count} 个`);
    console.log(`   年份范围: ${stats[3].rows[0].min_year} - ${stats[3].rows[0].max_year}`);
    
    // 5. 显示部分数据样本
    console.log('\n📋 数据样本（前5条）:');
    console.log('─'.repeat(80));
    const samples = await client.query(`
      SELECT 
        u.name as university_name,
        m.name as major_name,
        a.year,
        a.min_score,
        a.min_rank
      FROM admission_scores a
      JOIN universities u ON a.university_id = u.id
      JOIN majors m ON a.major_id = m.id
      ORDER BY a.min_score DESC
      LIMIT 5
    `);
    
    samples.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.university_name} - ${row.major_name}`);
      console.log(`   ${row.year}年: ${row.min_score}分, 位次${row.min_rank}`);
    });
    
    console.log('\n✅ 真实数据导入完成！');
    console.log('\n💡 提示: 现在可以运行 npm test 或 node test-api.js 测试推荐系统');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  importRealData()
    .then(() => {
      console.log('\n🎉 完成！');
      process.exit(0);
    })
    .catch(() => {
      console.error('\n💥 导入失败！');
      process.exit(1);
    });
}

module.exports = { importRealData };
