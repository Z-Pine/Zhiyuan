const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_du5TaptVfsP8@ep-wild-base-a1tvdx19-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始执行数据库迁移...\n');
    
    // 启用 UUID 扩展
    console.log('1️⃣ 启用 UUID 扩展...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('   ✅ UUID 扩展已启用\n');
    
    // 创建用户表
    console.log('2️⃣ 创建用户表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        phone VARCHAR(11) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nickname VARCHAR(50),
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('   ✅ 用户表已创建');
    
    // 创建考生档案表
    console.log('3️⃣ 创建考生档案表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
        id_card VARCHAR(18),
        province VARCHAR(20) NOT NULL,
        high_school VARCHAR(100),
        graduation_year INTEGER NOT NULL,
        subject_type VARCHAR(20) NOT NULL CHECK (subject_type IN ('physics', 'history')),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ 考生档案表已创建');
    
    // 创建成绩表
    console.log('4️⃣ 创建成绩表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        exam_year INTEGER NOT NULL,
        exam_type VARCHAR(20) NOT NULL DEFAULT 'gaokao',
        chinese INTEGER CHECK (chinese >= 0 AND chinese <= 150),
        math INTEGER CHECK (math >= 0 AND math <= 150),
        english INTEGER CHECK (english >= 0 AND english <= 150),
        physics INTEGER CHECK (physics >= 0 AND physics <= 100),
        history INTEGER CHECK (history >= 0 AND history <= 100),
        chemistry INTEGER CHECK (chemistry >= 0 AND chemistry <= 100),
        biology INTEGER CHECK (biology >= 0 AND biology <= 100),
        geography INTEGER CHECK (geography >= 0 AND geography <= 100),
        politics INTEGER CHECK (politics >= 0 AND politics <= 100),
        total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 750),
        rank INTEGER,
        special_line INTEGER,
        first_line INTEGER,
        second_line INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, exam_year)
      );
    `);
    console.log('   ✅ 成绩表已创建');
    
    // 创建学生画像表
    console.log('5️⃣ 创建学生画像表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
        interests TEXT[],
        abilities JSONB DEFAULT '{}',
        career_preferences TEXT[],
        province_preferences TEXT[],
        university_type_preferences TEXT[],
        major_preferences TEXT[],
        is_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ 学生画像表已创建');
    
    // 创建院校表
    console.log('6️⃣ 创建院校表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        english_name VARCHAR(200),
        province VARCHAR(20) NOT NULL,
        city VARCHAR(50),
        level VARCHAR(20)[] DEFAULT '{}',
        type VARCHAR(20),
        affiliation VARCHAR(50),
        founded_year INTEGER,
        website VARCHAR(200),
        logo_url TEXT,
        description TEXT,
        features TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ 院校表已创建');
    
    // 创建专业表
    console.log('7️⃣ 创建专业表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS majors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        subcategory VARCHAR(50),
        duration INTEGER DEFAULT 4,
        degree_type VARCHAR(50),
        subject_requirements JSONB DEFAULT '{}',
        description TEXT,
        training_objective TEXT,
        main_courses TEXT[],
        career_directions TEXT[],
        suitable_for TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ 专业表已创建');
    
    // 创建院校专业关联表
    console.log('8️⃣ 创建院校专业关联表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS university_majors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        major_id UUID NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
        is_key_major BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        ranking INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(university_id, major_id)
      );
    `);
    console.log('   ✅ 院校专业关联表已创建');
    
    // 创建录取数据表
    console.log('9️⃣ 创建录取数据表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admission_scores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        major_id UUID REFERENCES majors(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        province VARCHAR(20) NOT NULL,
        subject_type VARCHAR(20) NOT NULL CHECK (subject_type IN ('physics', 'history')),
        batch VARCHAR(20),
        min_score INTEGER,
        max_score INTEGER,
        avg_score INTEGER,
        min_rank INTEGER,
        avg_rank INTEGER,
        enrollment_count INTEGER,
        data_source VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(university_id, major_id, year, province, subject_type)
      );
    `);
    console.log('   ✅ 录取数据表已创建');
    
    // 创建行业数据表
    console.log('🔟 创建行业数据表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS industries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        employment_rate DECIMAL(5,2),
        avg_salary DECIMAL(10,2),
        salary_growth_rate DECIMAL(5,2),
        growth_rate DECIMAL(5,2),
        outlook VARCHAR(20) CHECK (outlook IN ('excellent', 'good', 'stable', 'declining')),
        risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
        related_skills TEXT[],
        related_positions TEXT[],
        data_source VARCHAR(100),
        data_year INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ 行业数据表已创建');
    
    // 创建专业行业关联表
    console.log('1️⃣1️⃣ 创建专业行业关联表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS major_industries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        major_id UUID NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
        industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
        relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(major_id, industry_id)
      );
    `);
    console.log('   ✅ 专业行业关联表已创建');
    
    // 创建推荐结果表
    console.log('1️⃣2️⃣ 创建推荐结果表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        score_id UUID NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
        batch_name VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
        is_exported BOOLEAN DEFAULT false,
        exported_at TIMESTAMP WITH TIME ZONE,
        export_format VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ 推荐结果表已创建');
    
    // 创建推荐详情表
    console.log('1️⃣3️⃣ 创建推荐详情表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendation_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
        university_id UUID NOT NULL REFERENCES universities(id),
        major_id UUID REFERENCES majors(id),
        type VARCHAR(20) NOT NULL CHECK (type IN ('sprint', 'steady', 'safe')),
        probability DECIMAL(5,2) CHECK (probability >= 0 AND probability <= 100),
        predicted_min_score INTEGER,
        predicted_min_rank INTEGER,
        recommendation_reason TEXT,
        risk_warning TEXT,
        reference_sources JSONB DEFAULT '[]',
        is_favorite BOOLEAN DEFAULT false,
        is_selected BOOLEAN DEFAULT false,
        notes TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ 推荐详情表已创建');
    
    // 创建对话记录表
    console.log('1️⃣4️⃣ 创建对话记录表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ 对话记录表已创建\n');
    
    // 创建索引
    console.log('📇 创建索引...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scores_student_id ON scores(student_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_universities_province ON universities(province);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_admission_year ON admission_scores(year);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_recommendations_student ON recommendations(student_id);');
    console.log('   ✅ 索引创建完成\n');
    
    // 验证结果
    console.log('🔍 验证数据库结构...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 已创建 ${result.rows.length} 个表:`);
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ 数据库迁移完成！');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error(error);
  process.exit(1);
});
