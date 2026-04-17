# 数据库设计文档

## T008: 数据库设计评审

## ER图

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │    students     │       │ student_profiles│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │──┐    │ PK id           │◄──────┤ PK id           │
│    phone        │  │    │ FK user_id      │       │ FK student_id   │
│    password     │  └──►│    name         │       │    mbti_type    │
│    nickname     │       │    gender       │       │    holland_code │
│    created_at   │       │    birth_date   │       │    strengths    │
└─────────────────┘       │    province     │       │    interests    │
                          │    created_at   │       └─────────────────┘
                          └─────────────────┘                │
                                    │                        │
                                    ▼                        ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │  exam_results   │       │recommendations  │
                          ├─────────────────┤       ├─────────────────┤
                          │ PK id           │       │ PK id           │
                          │ FK student_id   │       │ FK user_id      │
                          │    total_score  │       │ FK student_id   │
                          │    rank         │       │ FK exam_result_id│
                          │    province     │       │    data (JSON)  │
                          │    subject_type │       │    created_at   │
                          │    year         │       └─────────────────┘
                          └─────────────────┘                │
                                    │                        │
                                    ▼                        ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │  chat_sessions  │       │chat_messages    │
                          ├─────────────────┤       ├─────────────────┤
                          │ PK id           │◄──────┤ PK id           │
                          │ FK user_id      │       │ FK session_id   │
                          │ FK student_id   │       │    role         │
                          │ FK recommend_id │       │    content      │
                          │    status       │       │    created_at   │
                          └─────────────────┘       └─────────────────┘
```

## 表结构详细设计

### 1. users - 用户表

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
```

### 2. students - 考生表

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  province VARCHAR(50),
  city VARCHAR(50),
  high_school VARCHAR(100),
  subject_type VARCHAR(20) CHECK (subject_type IN ('physics', 'history')),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_status ON students(status);
```

### 3. student_profiles - 学生画像表

```sql
CREATE TABLE student_profiles (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mbti_type VARCHAR(10),
  holland_code VARCHAR(10),
  subject_strengths JSONB DEFAULT '[]',
  interest_tags JSONB DEFAULT '[]',
  ability_tags JSONB DEFAULT '[]',
  career_preference VARCHAR(50),
  study_style VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_profiles_student ON student_profiles(student_id);
CREATE INDEX idx_profiles_mbti ON student_profiles(mbti_type);
```

### 4. exam_results - 考试成绩表

```sql
CREATE TABLE exam_results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_type VARCHAR(20) DEFAULT 'gaokao',
  total_score INTEGER NOT NULL,
  rank INTEGER,
  province VARCHAR(50),
  subject_type VARCHAR(20),
  chinese_score INTEGER,
  math_score INTEGER,
  english_score INTEGER,
  physics_score INTEGER,
  chemistry_score INTEGER,
  biology_score INTEGER,
  history_score INTEGER,
  geography_score INTEGER,
  politics_score INTEGER,
  year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  exam_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_exam_student ON exam_results(student_id);
CREATE INDEX idx_exam_province ON exam_results(province, subject_type, year);
CREATE INDEX idx_exam_score ON exam_results(total_score DESC);
```

### 5. schools - 院校表

```sql
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  level VARCHAR(50),
  type VARCHAR(50),
  province VARCHAR(50),
  city VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  logo_url TEXT,
  is_985 BOOLEAN DEFAULT FALSE,
  is_211 BOOLEAN DEFAULT FALSE,
  is_double_first BOOLEAN DEFAULT FALSE,
  description TEXT,
  features JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_schools_level ON schools(level);
CREATE INDEX idx_schools_province ON schools(province);
CREATE INDEX idx_schools_tags ON schools(is_985, is_211, is_double_first);
```

### 6. majors - 专业表

```sql
CREATE TABLE majors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  category VARCHAR(50),
  subcategory VARCHAR(50),
  degree_type VARCHAR(50),
  duration INTEGER DEFAULT 4,
  description TEXT,
  career_prospects TEXT,
  core_courses JSONB DEFAULT '[]',
  required_subjects JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_majors_category ON majors(category);
CREATE INDEX idx_majors_name ON majors(name);
```

### 7. admission_scores - 录取分数表

```sql
CREATE TABLE admission_scores (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  major_id INTEGER REFERENCES majors(id),
  province VARCHAR(50) NOT NULL,
  subject_type VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  batch VARCHAR(50),
  min_score INTEGER,
  min_rank INTEGER,
  avg_score INTEGER,
  max_score INTEGER,
  enrollment_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_scores_school ON admission_scores(school_id);
CREATE INDEX idx_scores_major ON admission_scores(major_id);
CREATE INDEX idx_scores_query ON admission_scores(province, subject_type, year);
```

### 8. recommendations - 推荐结果表

```sql
CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_result_id INTEGER REFERENCES exam_results(id),
  recommendation_data JSONB NOT NULL,
  use_llm BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_student ON recommendations(student_id);
CREATE INDEX idx_recommendations_created ON recommendations(created_at DESC);
```

### 9. chat_sessions - 对话会话表

```sql
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  recommendation_id INTEGER REFERENCES recommendations(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
```

### 10. chat_messages - 对话消息表

```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'card')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
```

## 索引策略

### 高频查询索引

1. **用户登录**: `idx_users_phone`
2. **考生列表**: `idx_students_user_id`
3. **成绩查询**: `idx_exam_student`
4. **院校搜索**: `idx_schools_province`, `idx_schools_level`
5. **推荐历史**: `idx_recommendations_user`, `idx_recommendations_created`

### 复合索引

```sql
-- 录取分数查询优化
CREATE INDEX idx_admission_query ON admission_scores(province, subject_type, year, min_score);

-- 院校层次筛选
CREATE INDEX idx_school_level_tags ON schools(province, is_985, is_211, is_double_first);
```

## 数据分区策略

对于录取分数表，建议按年份分区：

```sql
-- 创建分区表（PostgreSQL 10+）
CREATE TABLE admission_scores (
  -- 列定义同上
) PARTITION BY RANGE (year);

-- 创建分区
CREATE TABLE admission_scores_2024 PARTITION OF admission_scores
  FOR VALUES FROM (2024) TO (2025);

CREATE TABLE admission_scores_2023 PARTITION OF admission_scores
  FOR VALUES FROM (2023) TO (2024);
```

## 备份策略

1. **自动备份**: Neon提供自动每日备份
2. **手动备份**: 重要操作前手动创建快照
3. **数据导出**: 定期导出关键表数据到CSV

## 性能优化建议

1. **查询优化**: 使用EXPLAIN ANALYZE分析慢查询
2. **连接池**: 使用pg-pool管理数据库连接
3. **缓存策略**: 对热点数据使用Redis缓存
4. **定期维护**: 定期VACUUM和ANALYZE
