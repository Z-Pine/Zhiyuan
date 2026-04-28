/**
 * 完整数据库表结构创建脚本
 * 包含所有业务表和索引
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const createCompleteSchema = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始创建完整数据库表结构...\n');
    
    await client.query('BEGIN');

    // ============================================
    // 1. 用户表
    // ============================================
    console.log('📝 创建 users 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nickname VARCHAR(100),
        avatar_url TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 2. 学生表
    // ============================================
    console.log('📝 创建 students 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
        birth_date DATE,
        province VARCHAR(50) NOT NULL DEFAULT '广东',
        city VARCHAR(50),
        high_school VARCHAR(100),
        subject_type VARCHAR(20) CHECK (subject_type IN ('physics', 'history', 'science', 'arts')),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 3. 学生画像表 (新增)
    // ============================================
    console.log('📝 创建 student_profiles 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
        mbti_type VARCHAR(10),
        holland_code VARCHAR(10),
        interests JSONB DEFAULT '[]',
        abilities JSONB DEFAULT '{}',
        career_preferences JSONB DEFAULT '[]',
        study_style VARCHAR(50),
        risk_preference VARCHAR(20) CHECK (risk_preference IN ('conservative', 'moderate', 'aggressive')),
        province_preferences JSONB DEFAULT '[]',
        university_type_preferences JSONB DEFAULT '[]',
        major_preferences JSONB DEFAULT '[]',
        family_expectations TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 4. 考试成绩表 (重命名为 exam_results)
    // ============================================
    console.log('📝 创建 exam_results 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_results (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        exam_type VARCHAR(20) DEFAULT 'gaokao',
        exam_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
        province VARCHAR(50) NOT NULL,
        subject_type VARCHAR(20) NOT NULL,
        total_score INTEGER NOT NULL,
        rank INTEGER,
        province_rank INTEGER,
        chinese_score INTEGER,
        math_score INTEGER,
        english_score INTEGER,
        physics_score INTEGER,
        chemistry_score INTEGER,
        biology_score INTEGER,
        history_score INTEGER,
        geography_score INTEGER,
        politics_score INTEGER,
        exam_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 5. 院校表 (universities)
    // ============================================
    console.log('📝 创建 universities 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        province VARCHAR(50),
        city VARCHAR(50),
        level JSONB DEFAULT '[]',
        type VARCHAR(50),
        is_985 BOOLEAN DEFAULT FALSE,
        is_211 BOOLEAN DEFAULT FALSE,
        is_double_first BOOLEAN DEFAULT FALSE,
        rank INTEGER,
        website VARCHAR(255),
        logo_url TEXT,
        description TEXT,
        features JSONB DEFAULT '[]',
        tags JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 6. 专业表
    // ============================================
    console.log('📝 创建 majors 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS majors (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(50),
        subcategory VARCHAR(50),
        degree_type VARCHAR(50),
        duration INTEGER DEFAULT 4,
        description TEXT,
        career_prospects TEXT,
        core_courses JSONB DEFAULT '[]',
        required_subjects JSONB DEFAULT '[]',
        salary_range VARCHAR(50),
        employment_rate DECIMAL(5,2),
        industry_trend VARCHAR(20),
        tags JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 7. 院校专业关联表
    // ============================================
    console.log('📝 创建 university_majors 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS university_majors (
        id SERIAL PRIMARY KEY,
        university_id INTEGER NOT NULL,
        major_id INTEGER NOT NULL,
        enrollment_plan INTEGER,
        tuition_fee INTEGER,
        special_requirements TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(university_id, major_id)
      )
    `);
    
    // 添加外键约束（如果不存在）
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'university_majors_university_id_fkey'
        ) THEN
          ALTER TABLE university_majors 
          ADD CONSTRAINT university_majors_university_id_fkey 
          FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'university_majors_major_id_fkey'
        ) THEN
          ALTER TABLE university_majors 
          ADD CONSTRAINT university_majors_major_id_fkey 
          FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // ============================================
    // 8. 录取分数表 (admission_scores)
    // ============================================
    console.log('📝 创建 admission_scores 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admission_scores (
        id SERIAL PRIMARY KEY,
        university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        major_id INTEGER REFERENCES majors(id) ON DELETE CASCADE,
        province VARCHAR(50) NOT NULL,
        subject_type VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        batch VARCHAR(50),
        min_score INTEGER,
        min_rank INTEGER,
        avg_score INTEGER,
        max_score INTEGER,
        enrollment_count INTEGER,
        source_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(university_id, major_id, province, subject_type, year)
      )
    `);

    // ============================================
    // 9. 行业数据表 (industries)
    // ============================================
    console.log('📝 创建 industries 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS industries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        category VARCHAR(50),
        avg_salary INTEGER,
        salary_trend JSONB DEFAULT '[]',
        demand_trend VARCHAR(20) CHECK (demand_trend IN ('rising', 'stable', 'declining')),
        employment_rate DECIMAL(5,2),
        risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
        description TEXT,
        source_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 10. 专业行业关联表
    // ============================================
    console.log('📝 创建 major_industries 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS major_industries (
        id SERIAL PRIMARY KEY,
        major_id INTEGER NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
        industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
        relevance_score DECIMAL(3,2) DEFAULT 0.5,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(major_id, industry_id)
      )
    `);

    // ============================================
    // 11. 推荐结果表
    // ============================================
    console.log('📝 创建 recommendations 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        exam_result_id INTEGER REFERENCES exam_results(id) ON DELETE SET NULL,
        recommendation_data JSONB NOT NULL,
        use_llm BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 12. 推荐反馈表
    // ============================================
    console.log('📝 创建 recommendation_feedback 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendation_feedback (
        id SERIAL PRIMARY KEY,
        recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 13. 对话会话表 (chat_sessions)
    // ============================================
    console.log('📝 创建 chat_sessions 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        recommendation_id INTEGER REFERENCES recommendations(id) ON DELETE SET NULL,
        title VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP
      )
    `);

    // ============================================
    // 14. 对话消息表 (chat_messages)
    // ============================================
    console.log('📝 创建 chat_messages 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'card')),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 15. 验证码表
    // ============================================
    console.log('📝 创建 verification_codes 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================
    // 创建索引
    // ============================================
    console.log('\n📊 创建索引...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)',
      'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
      'CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_students_province ON students(province)',
      'CREATE INDEX IF NOT EXISTS idx_student_profiles_student_id ON student_profiles(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_exam_results_province_year ON exam_results(province, exam_year)',
      'CREATE INDEX IF NOT EXISTS idx_universities_province ON universities(province)',
      'CREATE INDEX IF NOT EXISTS idx_universities_level ON universities USING GIN(level)',
      'CREATE INDEX IF NOT EXISTS idx_universities_tags ON universities USING GIN(tags)',
      'CREATE INDEX IF NOT EXISTS idx_majors_category ON majors(category)',
      'CREATE INDEX IF NOT EXISTS idx_majors_name ON majors(name)',
      'CREATE INDEX IF NOT EXISTS idx_admission_scores_university ON admission_scores(university_id)',
      'CREATE INDEX IF NOT EXISTS idx_admission_scores_query ON admission_scores(province, subject_type, year)',
      'CREATE INDEX IF NOT EXISTS idx_industries_name ON industries(name)',
      'CREATE INDEX IF NOT EXISTS idx_recommendations_student ON recommendations(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_recommendations_created ON recommendations(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status)',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone, expires_at)'
    ];

    for (const indexSql of indexes) {
      await client.query(indexSql);
    }

    await client.query('COMMIT');
    
    console.log('\n✅ 数据库表结构创建完成！');
    console.log('\n📋 已创建的表:');
    console.log('   1. users - 用户表');
    console.log('   2. students - 学生表');
    console.log('   3. student_profiles - 学生画像表');
    console.log('   4. exam_results - 考试成绩表');
    console.log('   5. universities - 院校表');
    console.log('   6. majors - 专业表');
    console.log('   7. university_majors - 院校专业关联表');
    console.log('   8. admission_scores - 录取分数表');
    console.log('   9. industries - 行业数据表');
    console.log('   10. major_industries - 专业行业关联表');
    console.log('   11. recommendations - 推荐结果表');
    console.log('   12. recommendation_feedback - 推荐反馈表');
    console.log('   13. chat_sessions - 对话会话表');
    console.log('   14. chat_messages - 对话消息表');
    console.log('   15. verification_codes - 验证码表');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 数据库创建失败:', error.message);
    console.error('详细错误:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  createCompleteSchema()
    .then(() => {
      console.log('\n🎉 数据库初始化成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 数据库初始化失败！');
      process.exit(1);
    });
}

module.exports = { createCompleteSchema };
