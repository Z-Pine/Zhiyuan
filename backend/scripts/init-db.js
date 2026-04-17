require('dotenv').config();
const { Pool } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已加载' : '未加载');

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'zhiyuan',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });
}

const initDatabase = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('数据库连接成功');
    
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(100),
        avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `);
    console.log('✓ users 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        province VARCHAR(50) DEFAULT '广东',
        city VARCHAR(50),
        category VARCHAR(20) DEFAULT '物理类',
        grade VARCHAR(20) DEFAULT '高三',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ students 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        year INTEGER DEFAULT 2024,
        total_score INTEGER NOT NULL,
        rank INTEGER,
        province_rank INTEGER,
        subject_scores JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ scores 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE UNIQUE,
        risk_preference VARCHAR(20),
        career_interest TEXT,
        region_preference TEXT,
        answers JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ profiles 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        province VARCHAR(50),
        city VARCHAR(50),
        level VARCHAR(20),
        category VARCHAR(50),
        rank INTEGER,
        tags JSONB DEFAULT '[]',
        features JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ schools 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS school_scores (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL,
        min_score INTEGER,
        avg_score INTEGER,
        max_score INTEGER,
        min_rank INTEGER,
        avg_rank INTEGER,
        max_rank INTEGER,
        admission_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(school_id, year, category)
      )
    `);
    console.log('✓ school_scores 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS majors (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(50),
        degree VARCHAR(20),
        duration VARCHAR(20),
        tags JSONB DEFAULT '[]',
        salary_range VARCHAR(50),
        employment_rate DECIMAL(5,2),
        industry_trend TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ majors 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS major_school_scores (
        id SERIAL PRIMARY KEY,
        major_id INTEGER REFERENCES majors(id) ON DELETE CASCADE,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL,
        min_score INTEGER,
        avg_score INTEGER,
        min_rank INTEGER,
        admission_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(major_id, school_id, year, category)
      )
    `);
    console.log('✓ major_school_scores 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        schools JSONB,
        majors JSONB,
        risk JSONB,
        use_llm BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ recommendations 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ verification_codes 表创建完成');

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        messages JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ chat_history 表创建完成');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scores_student_id ON scores(student_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_schools_province ON schools(province)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_schools_category ON schools(category)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_school_scores_school_id ON school_scores(school_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_majors_category ON majors(category)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recommendations_student_id ON recommendations(student_id)
    `);
    console.log('✓ 索引创建完成');

    await client.query('COMMIT');
    console.log('\n🎉 数据库初始化完成！');
    
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (e) {}
    }
    console.error('数据库初始化失败:', error.message);
    console.error('错误详情:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initDatabase };
