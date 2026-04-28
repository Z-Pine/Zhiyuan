const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function createProfileTable() {
  const client = await pool.connect();
  try {
    console.log('开始创建学生画像表...\n');
    
    // 检查表是否已存在
    const checkTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'student_profiles'
    `);

    if (checkTable.rows.length > 0) {
      console.log('ℹ️  student_profiles表已存在，跳过创建');
    } else {
      await client.query(`
        CREATE TABLE student_profiles (
          id SERIAL PRIMARY KEY,
          student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          
          -- 性格测评
          mbti_type VARCHAR(4),
          personality_traits JSONB,
          
          -- 职业兴趣（霍兰德代码）
          holland_code VARCHAR(10),
          interest_areas JSONB,
          
          -- 职业倾向
          career_preference VARCHAR(50),
          career_goals TEXT,
          
          -- 家庭因素
          family_expectations TEXT,
          location_preference VARCHAR(50),
          stay_near_home BOOLEAN,
          
          -- 其他偏好
          preferred_majors JSONB,
          avoid_majors JSONB,
          special_requirements TEXT,
          
          -- 时间戳
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          
          UNIQUE(student_id)
        );
      `);
      console.log('✅ 成功创建student_profiles表');
      
      // 添加索引
      await client.query(`
        CREATE INDEX idx_student_profiles_student_id ON student_profiles(student_id);
      `);
      console.log('✅ 创建索引');
      
      // 添加注释
      await client.query(`
        COMMENT ON TABLE student_profiles IS '学生画像表';
        COMMENT ON COLUMN student_profiles.mbti_type IS 'MBTI性格类型(如INTJ)';
        COMMENT ON COLUMN student_profiles.holland_code IS '霍兰德职业兴趣代码(如RIA)';
        COMMENT ON COLUMN student_profiles.career_preference IS '职业倾向(稳定/高薪/兴趣等)';
        COMMENT ON COLUMN student_profiles.location_preference IS '地域偏好(一线/省内/不限等)';
      `);
      console.log('✅ 添加表注释');
    }

    console.log('\n✨ 学生画像表准备完成！');
    console.log('\n📝 表结构:');
    
    const columns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'student_profiles'
      ORDER BY ordinal_position
    `);

    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(必填)' : '(可选)'}`);
    });

  } catch (e) {
    console.error('❌ 创建失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createProfileTable();
