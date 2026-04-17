# 高考志愿填报助手 - 技术设计文档 (TDD)

**版本**: V1.0  
**日期**: 2025年  
**状态**: 初稿

---

## 1. 技术架构概述

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           系统技术架构                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                        移动端 (Flutter)                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │
│  │  │  登录   │ │  考生   │ │  成绩   │ │  个性   │ │  AI    │  │  │
│  │  │  模块   │ │  档案   │ │  输入   │ │  画像   │ │  推荐   │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                        API网关 (Nginx)                           │  │
│  │              负载均衡 / 限流 / 静态资源 / SSL                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      后端服务 (Node.js)                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │
│  │  │  用户   │ │  考生   │ │  推荐   │ │  数据   │ │  消息   │  │  │
│  │  │  服务   │ │  服务   │ │  引擎   │ │  服务   │ │  队列   │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│              ┌─────────────────────┼─────────────────────┐           │
│              ▼                     ▼                     ▼           │
│  ┌──────────────────┐  ┌──────────────────┐                      │
│  │   PostgreSQL     │  │      Redis        │                      │
│  │   (云端RDS)     │  │   (云端缓存)     │                      │
│  └──────────────────┘  └──────────────────┘                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       外部数据源                                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │   │
│  │  │ 高考数据  │ │ 院校数据  │ │ 行业数据  │                       │   │
│  │  │ 爬虫/API  │ │ 爬虫/导入 │ │ 第三方   │                       │   │
│  │  └──────────┘ └──────────┘ └──────────┘                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     第三方AI服务                                 │   │
│  │  ┌──────────────────────────────────────────┐                  │   │
│  │  │  阿里云通义千问 (用户可选开启)            │                  │   │
│  │  └──────────────────────────────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

| 层级 | 技术选型 | 理由 |
|------|---------|------|
| 移动端 | Flutter | 一套代码同时支持Android/iOS，开发效率高 |
| 后端 | Node.js + Express | 轻量、生态丰富，适合个人/小团队 |
| 数据库 | 云端PostgreSQL (Railway/Neon) | 无服务器方案，云端托管 |
| 缓存 | Redis | 会话缓存、数据缓存 |
| 日志 | 云端日志服务 | 简化运维 |
| 部署 | Serverless (Vercel/Railway) | 无需服务器，按需付费 |
| AI引擎 | 规则引擎(默认) + 通义千问API(可选) | 灵活切换 |

---

## 2. 后端架构设计

### 2.1 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   │   ├── database.js   # 数据库配置
│   │   ├── redis.js     # Redis配置
│   │   └── env.js       # 环境变量
│   ├── controllers/     # 控制器层
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── scoreController.js
│   │   ├── profileController.js
│   │   ├── recommendationController.js
│   │   └── dataController.js
│   ├── services/         # 业务逻辑层
│   │   ├── authService.js
│   │   ├── studentService.js
│   │   ├── aiRecommendService.js
│   │   ├── dataCollectionService.js
│   │   └── employmentAnalysisService.js
│   ├── models/          # 数据模型
│   │   ├── user.js
│   │   ├── student.js
│   │   ├── score.js
│   │   ├── profile.js
│   │   ├── university.js
│   │   ├── major.js
│   │   ├── admissionRecord.js
│   │   ├── industry.js
│   │   └── recommendation.js
│   ├── routes/          # 路由定义
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── scoreRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── recommendRoutes.js
│   │   └── dataRoutes.js
│   ├── middleware/      # 中间件
│   │   ├── authMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── errorMiddleware.js
│   ├── utils/           # 工具函数
│   │   ├── jwtUtil.js
│   │   ├── passwordUtil.js
│   │   └── validationUtil.js
│   ├── crawlers/        # 爬虫脚本
│   │   ├── scoreCrawler.js
│   │   ├── universityCrawler.js
│   │   └── industryCrawler.js
│   └── app.js           # 应用入口
├── scripts/             # 脚本
│   ├── initDb.js        # 数据库初始化
│   ├── seedData.js     # 种子数据
│   └── importData.js   # 数据导入
├── package.json
└── .env.example
```

### 2.2 API接口设计

#### 2.2.1 认证模块

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/auth/register | POST | 手机号注册 |
| /api/auth/login | POST | 密码登录 |
| /api/auth/sendCode | POST | 发送验证码 |
| /api/auth/resetPassword | POST | 重置密码 |
| /api/auth/wechatLogin | POST | 微信登录 |

#### 2.2.2 考生管理模块

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/students | GET | 获取考生列表 |
| /api/students | POST | 添加考生 |
| /api/students/:id | GET | 获取考生详情 |
| /api/students/:id | PUT | 更新考生信息 |
| /api/students/:id | DELETE | 删除考生 |

#### 2.2.3 成绩管理模块

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/scores | GET | 获取成绩列表 |
| /api/scores | POST | 录入成绩 |
| /api/scores/:id | GET | 获取成绩详情 |
| /api/scores/:id | PUT | 更新成绩 |
| /api/scores/validate | POST | 校验成绩合理性 |

#### 2.2.4 个性画像模块

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/profiles/:studentId | GET | 获取画像 |
| /api/profiles/:studentId | PUT | 更新画像 |
| /api/profiles/questions | GET | 获取问答问题列表 |
| /api/profiles/submit | POST | 提交问答结果 |

#### 2.2.5 AI推荐模块

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/recommend | POST | 生成推荐方案 |
| /api/recommend/chat | POST | 追问/对话 |
| /api/recommend/history | GET | 推荐历史 |
| /api/recommend/export | POST | 导出志愿表 |

#### 2.2.6 数据查询模块

| 接口 | 方法 |说明 |
|------|------|------|
| /api/universities | GET | 院校列表 |
| /api/universities/:id | GET | 院校详情 |
| /api/majors | GET | 专业列表 |
| /api/majors/:id | GET | 专业详情 |
| /api/admission-records | GET | 录取数据 |
| /api/industries | GET | 行业数据 |

### 2.3 数据库设计

#### 2.3.1 ER图关系

```
┌─────────┐       ┌──────────┐       ┌─────────┐
│  users  │──1:N──│ students │──1:N──│ scores  │
└─────────┘       └──────────┘       └─────────┘
                         │
                         │1:1
                         ▼
                  ┌───────────┐
                  │ profiles  │
                  └───────────┘
                         │
                         │1:N
                         ▼
                  ┌────────────────┐
                  │ recommendations│
                  └────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌───────────┐ ┌───────────┐ ┌───────────┐
    │universities│ │  majors   │ │ industries│
    └───────────┘ └───────────┘ └───────────┘
          │              │
          ▼              ▼
    ┌───────────┐ ┌───────────┐
    │admission  │ │employment │
    │ records   │ │  data     │
    └───────────┘ └───────────┘
```

#### 2.3.2 核心表结构

**users 表**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  nickname VARCHAR(50),
  avatar_url VARCHAR(500),
  wechat_openid VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_wechat ON users(wechat_openid);
```

**students 表**
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  province VARCHAR(20) NOT NULL,
  category VARCHAR(20) NOT NULL,
  subject_combination VARCHAR(100),
  physical_conditions JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_status ON students(status);
```

**universities 表**
```sql
CREATE TABLE universities (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE,
  name VARCHAR(100) NOT NULL,
  province VARCHAR(20),
  city VARCHAR(50),
  level VARCHAR(50),
  type VARCHAR(50),
  categories JSONB,
  admission_notes TEXT,
  ranking JSONB,
  source_urls JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_universities_province ON universities(province);
CREATE INDEX idx_universities_level ON universities(level);
CREATE INDEX idx_universities_name ON universities USING gin(to_tsvector('simple', name));
```

**majors 表**
```sql
CREATE TABLE majors (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  sub_category VARCHAR(50),
  duration VARCHAR(20),
  careers TEXT,
  employment_outlook JSONB,
  postgrad适配性 JSONB,
  source_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_majors_code ON majors(code);
CREATE INDEX idx_majors_category ON majors(category);
```

**recommendations 表**
```sql
CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  score_id INT REFERENCES scores(id),
  rec_type VARCHAR(20) NOT NULL,
  university_id INT REFERENCES universities(id),
  major_id INT REFERENCES majors(id),
  reason TEXT,
  risk_warnings JSONB,
  source_refs JSONB,
  meta_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recommendations_student ON recommendations(student_id);
CREATE INDEX idx_recommendations_type ON recommendations(rec_type);
```

---

## 3. AI推荐引擎设计

### 3.1 推荐算法架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI推荐引擎架构                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        输入层                                    │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │   │
│  │  │ 成绩    │ │ 个性    │ │ 就业    │                          │   │
│  │  │ 信息    │ │ 画像    │ │ 意向    │                          │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘                          │   │
│  └───────┼───────────┼───────────┼────────────────────┬───────────┘   │
│          │           │           │                      │                │
│          ▼           ▼           ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     特征工程层                                    │   │
│  │  • 分数特征：总分、排名、位次                                    │   │
│  │  • 画像特征：性格代码、兴趣向量、职业倾向                        │   │
│  │  • 就业特征：行业偏好、薪资预期、工作地点                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     规则引擎层                                    │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  规则1: 位次法推荐                                        │   │   │
│  │  │    冲刺 = 位次 - 1000 ~ -2000                            │   │   │
│  │  │    稳妥 = 位次 ± 500                                      │   │   │
│  │  │    保底 = 位次 + 5000+                                    │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  规则2: 就业匹配                                          │   │   │
│  │  │    兴趣 → 职业 → 专业 → 行业 → 院校                      │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  规则3: 风险评估                                          │   │   │
│  │  │    行业趋势 + 院校认可 + 就业率 → 风险等级               │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     输出层                                        │   │
│  │  • 院校推荐（冲刺/稳妥/保底）                                   │   │
│  │  • 专业推荐（含就业分析）                                       │   │
│  │  • 风险提示                                                    │   │
│  │  • 参考来源                                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 3.2 大模型模式（可选）

当用户开启大模型分析模式时，系统会调用通义千问API进行深度分析：

```
用户输入（画像+成绩+问题）
        │
        ▼
┌─────────────────────┐
│  构建Prompt模板      │
│  • 考生基础信息      │
│  • 成绩及排名       │
│  • 个性画像摘要     │
│  • 参考数据引用     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  通义千问API调用    │
│  (GPT/Qwen-Plus)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  解析响应结果       │
│  • 推荐院校         │
│  • 推荐理由         │
│  • 风险提示         │
│  • 参考来源         │
└──────────┬──────────┘
           │
           ▼
     返回推荐结果
```

**大模型Prompt设计要点**：
- 必须引用本地数据库中的真实数据
- 每条建议必须附带数据来源
- 优先使用规则引擎的结果作为参考

### 3.2 推荐流程

```javascript
// 推荐算法伪代码
async function generateRecommendation(student, score, profile) {
  // 1. 位次分层
  const { rush, safe, backup } = await calculateSchoolByRank(score.rank);
  
  // 2. 就业匹配
  const matchedMajors = await matchMajorsByProfile(profile);
  
  // 3. 风险评估
  const riskWarnings = await assessRisks(matchedMajors);
  
  // 4. 关联参考来源
  const recommendations = await attachSources({
    rush, safe, backup, matchedMajors, riskWarnings
  });
  
  // 5. 保存推荐结果
  await saveRecommendations(student.id, recommendations);
  
  return recommendations;
}
```

---

## 4. 数据采集设计

### 4.1 数据来源

| 数据类型 | 来源 | 采集方式 | 更新频率 |
|---------|------|---------|---------|
| 高考分数线 | 各省考试院 | 爬虫/API | 每年6-8月 |
| 院校招生章程 | 阳光高考网 | 爬虫 | 每年3-5月 |
| 专业目录 | 教育部 | 导入 | 按发布 |
| 学科评估 | 教育部 | 导入 | 按发布 |
| 行业薪资 | 第三方报告 | 导入 | 每年 |

### 4.2 爬虫架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         数据采集架构                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      调度中心 (Scheduler)                        │   │
│  │  • 定时任务管理                                                   │   │
│  │  • 任务队列                                                       │   │
│  │  • 失败重试                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│          ┌─────────────────────────┼─────────────────────────┐        │
│          │                         │                         │        │
│          ▼                         ▼                         ▼        │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐     │
│  │ 分数线爬虫    │      │ 院校爬虫       │      │ 行业数据导入  │     │
│  │ (省考试院)   │      │ (阳光高考)     │      │ (CSV/Excel)   │     │
│  └───────────────┘      └───────────────┘      └───────────────┘     │
│          │                         │                         │        │
│          └─────────────────────────┼─────────────────────────┘        │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      数据处理管道                                │   │
│  │  • 清洗、去重                                                      │   │
│  │  • 格式标准化                                                     │   │
│  │  • 关联数据                                                       │   │
│  │  • 质量检查                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      数据存储                                    │   │
│  │  • PostgreSQL (结构化数据)                                       │   │
│  │  • 文件存储 (PDF/章程原文)                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 安全设计

### 5.1 认证与授权

| 机制 | 实现 |
|------|------|
| JWT | 访问令牌 + 刷新令牌 |
| 密码加密 | bcrypt |
| HTTPS | 全站强制 |
| CORS | 白名单配置 |
| 请求限流 | Redis计数器 |

### 5.2 数据安全

| 措施 | 说明 |
|------|------|
| 敏感数据加密 | 用户隐私数据AES加密 |
| 数据脱敏 | API返回数据脱敏处理 |
| 日志脱敏 | 日志中敏感信息打码 |
| 备份策略 | 每日全量 + 增量备份 |

---

## 6. 性能设计

### 6.1 缓存策略

| 数据类型 | 缓存策略 | TTL |
|---------|---------|-----|
| 院校列表 | Redis | 1天 |
| 专业列表 | Redis | 1天 |
| 录取数据 | Redis | 1天 |
| 用户会话 | Redis | 7天 |
| 热门推荐 | Redis | 1小时 |

### 6.2 性能指标

| 指标 | 目标值 |
|------|-------|
| API响应时间 | < 200ms (P99) |
| 推荐生成时间 | < 10s |
| 并发支持 | 1000+ |
| 数据库连接池 | 20-50 |

---

## 7. 部署设计（Serverless方案）

### 7.1 部署架构

由于无服务器资源，采用Serverless云部署方案：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Serverless 部署架构                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                       CDN (Cloudflare/阿里云)                    │   │
│   │                  静态资源加速 + SSL证书                         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    Vercel (前端)                                 │   │
│   │            Next.js 静态部署 (免费层)                            │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                   Railway (后端API)                             │   │
│   │            Node.js + Express (付费起付)                         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│   ┌──────────────────┐  ┌──────────────────┐                        │
│  │   PostgreSQL     │  │      Redis       │                        │
│  │   (Railway/Neon)│  │   (Railway)     │                        │
│  │   免费/付费层    │  │   (可选)        │                        │
│  └──────────────────┘  └──────────────────┘                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 云服务选型

| 服务 | 选型 | 费用 | 说明 |
|------|------|------|------|
| 前端托管 | Vercel | 免费 | 静态页面+Serverless Functions |
| 后端托管 | Railway | $5/月起 | 按需付费 |
| 数据库 | Neon/Railway | 免费层够用 | PostgreSQL |
| 域名 | 阿里云/腾讯云 | ¥30+/年 | 需自行购买 |
| SSL | Let's Encrypt/Vercel | 免费 | 自动续期 |
| 大模型API | 阿里云通义千问 | 按量计费 | 用户开启时调用 |

### 7.3 部署配置

**Vercel 配置 (vercel.json)**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "nextjs",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

**Railway 配置 (railway.json)**:
```json
{
  "$schema": "https://railway.app/schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 7.4 环境变量配置

```bash
# 数据库连接
DATABASE_URL=postgresql://user:pass@host:5432/zhiyuan

# JWT密钥
JWT_SECRET=your-secret-key

# 通义千问API（如启用大模型）
DASHSCOPE_API_KEY=your-api-key

# Redis（可选）
REDIS_URL=redis://host:6379
```

### 7.5 上线流程

1. **前端部署** → Vercel 关联 GitHub 仓库，自动部署
2. **后端部署** → Railway 关联 GitHub，自动部署
3. **数据库创建** → Neon/Railway 创建数据库实例
4. **域名绑定** → 购买域名，配置DNS解析
5. **SSL配置** → Vercel 自动配置HTTPS

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: zhiyuan
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 8. 监控与日志

### 8.1 监控指标

| 类别 | 指标 |
|------|------|
| 基础设施 | CPU/内存/磁盘/网络 |
| 应用 | 请求量/响应时间/错误率 |
| 业务 | 注册数/推荐生成数/活跃用户 |

### 8.2 日志规范

```
日志格式: [时间] [级别] [模块] [请求ID] 消息

示例:
[2025-01-15 10:30:25] [INFO] [recommendation] [req-abc123] 开始生成推荐方案
[2025-01-15 10:30:28] [INFO] [recommendation] [req-abc123] 推荐方案生成完成，耗时3.2s
[2025-01-15 10:30:28] [ERROR] [recommendation] [req-abc123] 院校数据查询失败: timeout
```

---

## 9. 目录结构汇总

```
Zhiyuan/
├── docs/                    # 项目文档
│   ├── PRD.md              # 产品需求文档
│   ├── TDD.md              # 技术设计文档
│   ├── API.md              # API接口文档
│   ├── TEST.md             # 测试方案
│   └── DATA.md             # 数据采集计划
│
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── config/         # 配置
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具
│   │   └── crawlers/       # 爬虫
│   ├── scripts/            # 脚本
│   ├── package.json
│   └── .env.example
│
├── frontend/               # 移动端项目 (Flutter)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── pages/          # 页面
│   │   ├── widgets/        # 组件
│   │   ├── services/       # API服务
│   │   ├── models/         # 数据模型
│   │   └── utils/          # 工具
│   ├── pubspec.yaml
│   └── README.md
│
└── data/                   # 数据文件
    ├── raw/                # 原始数据
    ├── processed/          # 处理后数据
    └── seeds/              # 种子数据
```
