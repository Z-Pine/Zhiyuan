/**
 * 更新推荐相关数据库表结构
 * 适配新的推荐引擎
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../src/config/database');

const updateSchema = async () => {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('🔄 更新推荐系统数据库结构');
    console.log('========================================\n');
    
    await client.query('BEGIN');
    
    // 1. 检查并更新 recommendations 表
    console.log('1. 更新 recommendations 表...');
    
    const checkRecColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recommendations'
    `);
    
    const recColumns = checkRecColumns.rows.map(r => r.column_name);
    console.log('   现有字段:', recColumns);
    
    // 添加新字段
    if (!recColumns.includes('recommendation_data')) {
      await client.query(`
        ALTER TABLE recommendations 
        ADD COLUMN recommendation_data JSONB
      `);
      console.log('   ✓ 添加 recommendation_data 字段');
    }
    
    if (!recColumns.includes('user_id')) {
      await client.query(`
        ALTER TABLE recommendations 
        ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('   ✓ 添加 user_id 字段');
    }
    
    if (!recColumns.includes('exam_result_id')) {
      await client.query(`
        ALTER TABLE recommendations 
        ADD COLUMN exam_result_id INTEGER
      `);
      console.log('   ✓ 添加 exam_result_id 字段');
    }
    
    // 2. 创建 recommendation_feedback 表
    console.log('\n2. 创建 recommendation_feedback 表...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendation_feedback (
        id SERIAL PRIMARY KEY,
        recommendation_id INTEGER REFERENCES recommendations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✓ recommendation_feedback 表创建完成');
    
    // 3. 创建 student_profiles 表（如果不存在）
    console.log('\n3. 创建 student_profiles 表...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        mbti_type VARCHAR(10),
        holland_code VARCHAR(10),
        subject_strengths JSONB DEFAULT '[]',
        interest_tags JSONB DEFAULT '[]',
        ability_tags JSONB DEFAULT '[]',
        career_preference VARCHAR(50),
        risk_preference VARCHAR(20) DEFAULT 'medium',
        region_preference JSONB DEFAULT '[]',
        answers JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✓ student_profiles 表创建完成');
    
    // 4. 创建 exam_results 表（如果不存在）
    console.log('\n4. 创建 exam_results 表...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_results (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        year INTEGER DEFAULT 2024,
        total_score INTEGER NOT NULL,
        rank INTEGER,
        province_rank INTEGER,
        province VARCHAR(50),
        subject_type VARCHAR(20),
        exam_date DATE,
        subject_scores JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✓ exam_results 表创建完成');
    
    // 5. 创建 industries 表（如果不存在）
    console.log('\n5. 创建 industries 表...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS industries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50),
        avg_salary INTEGER,
        salary_trend VARCHAR(20),
        growth_rate DECIMAL(5,2),
        employment_rate DECIMAL(5,2),
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✓ industries 表创建完成');
    
    // 6. 创建 school_majors 关联表（如果不存在）
    console.log('\n6. 创建 school_majors 关联表...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS school_majors (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        major_id INTEGER REFERENCES majors(id) ON DELETE CASCADE,
        is_key_major BOOLEAN DEFAULT FALSE,
        is_national_feature BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(school_id, major_id)
      )
    `);
    console.log('   ✓ school_majors 表创建完成');
    
    // 7. 创建索引
    console.log('\n7. 创建索引...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recommendations_student_id ON recommendations(student_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_id ON recommendation_feedback(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_student_profiles_student_id ON student_profiles(student_id)
    `);
    console.log('   ✓ 索引创建完成');
    
    await client.query('COMMIT');
    
    console.log('\n========================================');
    console.log('✅ 数据库结构更新完成！');
    console.log('========================================');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 更新失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

updateSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
