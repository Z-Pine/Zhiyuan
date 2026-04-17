-- ============================================
-- T102: 生产环境数据库迁移脚本
-- 高考志愿填报助手 - PostgreSQL
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户表 (users)
-- ============================================
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

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.phone IS '手机号，唯一';
COMMENT ON COLUMN users.password_hash IS '密码哈希';

-- ============================================
-- 2. 考生档案表 (students)
-- ============================================
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

COMMENT ON TABLE students IS '考生档案表';
COMMENT ON COLUMN students.subject_type IS '首选科目类型：physics-物理类, history-历史类';

-- ============================================
-- 3. 成绩表 (scores)
-- ============================================
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    exam_year INTEGER NOT NULL,
    exam_type VARCHAR(20) NOT NULL DEFAULT 'gaokao',
    
    -- 必考科目
    chinese INTEGER CHECK (chinese >= 0 AND chinese <= 150),
    math INTEGER CHECK (math >= 0 AND math <= 150),
    english INTEGER CHECK (english >= 0 AND english <= 150),
    
    -- 首选科目
    physics INTEGER CHECK (physics >= 0 AND physics <= 100),
    history INTEGER CHECK (history >= 0 AND history <= 100),
    
    -- 再选科目
    chemistry INTEGER CHECK (chemistry >= 0 AND chemistry <= 100),
    biology INTEGER CHECK (biology >= 0 AND biology <= 100),
    geography INTEGER CHECK (geography >= 0 AND geography <= 100),
    politics INTEGER CHECK (politics >= 0 AND politics <= 100),
    
    -- 总分和位次
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 750),
    rank INTEGER,
    
    -- 批次线
    special_line INTEGER,
    first_line INTEGER,
    second_line INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id, exam_year)
);

COMMENT ON TABLE scores IS '成绩表';
COMMENT ON COLUMN scores.rank IS '全省位次';

-- ============================================
-- 4. 学生画像表 (profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    
    -- 兴趣标签（数组存储）
    interests TEXT[],
    
    -- 能力自评（JSON存储）
    abilities JSONB DEFAULT '{}',
    
    -- 职业倾向（数组存储）
    career_preferences TEXT[],
    
    -- 地域偏好
    province_preferences TEXT[],
    
    -- 院校类型偏好
    university_type_preferences TEXT[],
    
    -- 专业偏好
    major_preferences TEXT[],
    
    -- 是否完成问卷
    is_completed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE profiles IS '学生画像表';
COMMENT ON COLUMN profiles.interests IS '兴趣标签数组';
COMMENT ON COLUMN profiles.abilities IS '能力自评JSON';

-- ============================================
-- 5. 院校表 (universities)
-- ============================================
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    english_name VARCHAR(200),
    province VARCHAR(20) NOT NULL,
    city VARCHAR(50),
    
    -- 院校层次
    level VARCHAR(20)[] DEFAULT '{}',
    
    -- 院校类型
    type VARCHAR(20),
    
    -- 隶属关系
    affiliation VARCHAR(50),
    
    -- 基本信息
    founded_year INTEGER,
    website VARCHAR(200),
    logo_url TEXT,
    
    -- 简介
    description TEXT,
    
    -- 特色标签
    features TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE universities IS '院校表';
COMMENT ON COLUMN universities.level IS '院校层次：985, 211, double_first_class 等';
COMMENT ON COLUMN universities.type IS '院校类型：综合, 理工, 师范, 医药 等';

-- ============================================
-- 6. 专业表 (majors)
-- ============================================
CREATE TABLE IF NOT EXISTS majors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    
    -- 学科门类
    category VARCHAR(50) NOT NULL,
    
    -- 专业类
    subcategory VARCHAR(50),
    
    -- 学制
    duration INTEGER DEFAULT 4,
    
    -- 学位类型
    degree_type VARCHAR(50),
    
    -- 选科要求
    subject_requirements JSONB DEFAULT '{}',
    
    -- 专业介绍
    description TEXT,
    
    -- 培养目标
    training_objective TEXT,
    
    -- 主要课程
    main_courses TEXT[],
    
    -- 就业方向
    career_directions TEXT[],
    
    -- 适合人群特征
    suitable_for TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE majors IS '专业表';
COMMENT ON COLUMN majors.category IS '学科门类：哲学, 经济学, 法学, 教育学, 文学, 历史学, 理学, 工学, 农学, 医学, 管理学, 艺术学';
COMMENT ON COLUMN majors.subject_requirements IS '选科要求JSON';

-- ============================================
-- 7. 院校专业关联表 (university_majors)
-- ============================================
CREATE TABLE IF NOT EXISTS university_majors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    major_id UUID NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
    
    -- 专业特色
    is_key_major BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- 专业排名
    ranking INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(university_id, major_id)
);

COMMENT ON TABLE university_majors IS '院校专业关联表';

-- ============================================
-- 8. 录取数据表 (admission_scores)
-- ============================================
CREATE TABLE IF NOT EXISTS admission_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    major_id UUID REFERENCES majors(id) ON DELETE CASCADE,
    
    -- 年份和省份
    year INTEGER NOT NULL,
    province VARCHAR(20) NOT NULL,
    
    -- 科类
    subject_type VARCHAR(20) NOT NULL CHECK (subject_type IN ('physics', 'history')),
    
    -- 批次
    batch VARCHAR(20),
    
    -- 录取数据
    min_score INTEGER,
    max_score INTEGER,
    avg_score INTEGER,
    min_rank INTEGER,
    avg_rank INTEGER,
    
    -- 招生计划
    enrollment_count INTEGER,
    
    -- 数据来源
    data_source VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(university_id, major_id, year, province, subject_type)
);

COMMENT ON TABLE admission_scores IS '录取数据表';
COMMENT ON COLUMN admission_scores.min_rank IS '最低录取位次';

-- ============================================
-- 9. 行业数据表 (industries)
-- ============================================
CREATE TABLE IF NOT EXISTS industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    -- 就业数据
    employment_rate DECIMAL(5,2),
    avg_salary DECIMAL(10,2),
    salary_growth_rate DECIMAL(5,2),
    
    -- 发展前景
    growth_rate DECIMAL(5,2),
    outlook VARCHAR(20) CHECK (outlook IN ('excellent', 'good', 'stable', 'declining')),
    
    -- 风险等级
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- 相关技能
    related_skills TEXT[],
    
    -- 相关职位
    related_positions TEXT[],
    
    -- 数据来源
    data_source VARCHAR(100),
    data_year INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE industries IS '行业数据表';
COMMENT ON COLUMN industries.outlook IS '发展前景：excellent-优秀, good-良好, stable-稳定, declining-下滑';

-- ============================================
-- 10. 专业行业关联表 (major_industries)
-- ============================================
CREATE TABLE IF NOT EXISTS major_industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    major_id UUID NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
    industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(major_id, industry_id)
);

COMMENT ON TABLE major_industries IS '专业行业关联表';
COMMENT ON COLUMN major_industries.relevance_score IS '关联度分数 0-100';

-- ============================================
-- 11. 推荐结果表 (recommendations)
-- ============================================
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score_id UUID NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
    
    -- 推荐批次
    batch_name VARCHAR(50),
    
    -- 推荐状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    
    -- 是否已导出
    is_exported BOOLEAN DEFAULT false,
    exported_at TIMESTAMP WITH TIME ZONE,
    
    -- 导出格式
    export_format VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE recommendations IS '推荐结果表';

-- ============================================
-- 12. 推荐详情表 (recommendation_items)
-- ============================================
CREATE TABLE IF NOT EXISTS recommendation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id),
    major_id UUID REFERENCES majors(id),
    
    -- 推荐类型
    type VARCHAR(20) NOT NULL CHECK (type IN ('sprint', 'steady', 'safe')),
    
    -- 录取概率
    probability DECIMAL(5,2) CHECK (probability >= 0 AND probability <= 100),
    
    -- 预测分数和位次
    predicted_min_score INTEGER,
    predicted_min_rank INTEGER,
    
    -- 推荐理由
    recommendation_reason TEXT,
    
    -- 风险提示
    risk_warning TEXT,
    
    -- 参考来源
    reference_sources JSONB DEFAULT '[]',
    
    -- 用户交互
    is_favorite BOOLEAN DEFAULT false,
    is_selected BOOLEAN DEFAULT false,
    notes TEXT,
    
    -- 排序
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE recommendation_items IS '推荐详情表';
COMMENT ON COLUMN recommendation_items.type IS '推荐类型：sprint-冲刺, steady-稳妥, safe-保底';
COMMENT ON COLUMN recommendation_items.probability IS '录取概率 0-100';

-- ============================================
-- 13. 对话记录表 (chat_messages)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    
    -- 消息类型
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    
    -- 消息内容
    content TEXT NOT NULL,
    
    -- 元数据（如引用的推荐项ID）
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE chat_messages IS '对话记录表';
COMMENT ON COLUMN chat_messages.role IS '角色：user-用户, assistant-助手, system-系统';

-- ============================================
-- 创建索引
-- ============================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 考生表索引
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_province ON students(province);

-- 成绩表索引
CREATE INDEX IF NOT EXISTS idx_scores_student_id ON scores(student_id);
CREATE INDEX IF NOT EXISTS idx_scores_total_score ON scores(total_score);
CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores(rank);

-- 院校表索引
CREATE INDEX IF NOT EXISTS idx_universities_province ON universities(province);
CREATE INDEX IF NOT EXISTS idx_universities_level ON universities USING GIN(level);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(type);

-- 专业表索引
CREATE INDEX IF NOT EXISTS idx_majors_category ON majors(category);
CREATE INDEX IF NOT EXISTS idx_majors_subcategory ON majors(subcategory);

-- 录取数据表索引
CREATE INDEX IF NOT EXISTS idx_admission_university ON admission_scores(university_id);
CREATE INDEX IF NOT EXISTS idx_admission_major ON admission_scores(major_id);
CREATE INDEX IF NOT EXISTS idx_admission_year ON admission_scores(year);
CREATE INDEX IF NOT EXISTS idx_admission_province ON admission_scores(province);
CREATE INDEX IF NOT EXISTS idx_admission_subject_type ON admission_scores(subject_type);
CREATE INDEX IF NOT EXISTS idx_admission_min_score ON admission_scores(min_score);
CREATE INDEX IF NOT EXISTS idx_admission_min_rank ON admission_scores(min_rank);

-- 推荐表索引
CREATE INDEX IF NOT EXISTS idx_recommendations_student ON recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);

-- 推荐详情表索引
CREATE INDEX IF NOT EXISTS idx_rec_items_recommendation ON recommendation_items(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_items_type ON recommendation_items(type);
CREATE INDEX IF NOT EXISTS idx_rec_items_probability ON recommendation_items(probability);

-- 对话记录表索引
CREATE INDEX IF NOT EXISTS idx_chat_recommendation ON chat_messages(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at);

-- ============================================
-- 创建更新时间触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新 updated_at 的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_majors_updated_at BEFORE UPDATE ON majors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admission_scores_updated_at BEFORE UPDATE ON admission_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industries_updated_at BEFORE UPDATE ON industries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendation_items_updated_at BEFORE UPDATE ON recommendation_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 插入基础数据
-- ============================================

-- 插入测试用户（密码需要替换为实际哈希值）
-- INSERT INTO users (phone, password_hash, nickname) 
-- VALUES ('13800138000', 'hashed_password', '测试用户');

-- 插入批次线参考数据（2024年湖北省）
-- INSERT INTO score_lines (province, year, subject_type, special_line, first_line, second_line)
-- VALUES ('湖北', 2024, 'physics', 525, 424, NULL);

-- ============================================
-- 迁移完成
-- ============================================
SELECT '生产环境数据库迁移完成！' AS message;
