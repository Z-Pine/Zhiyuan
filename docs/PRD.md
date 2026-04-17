# 高考志愿填报助手 - 产品需求文档 (PRD)

**版本**: V2.0  
**日期**: 2025年  
**状态**: 初稿

---

## 1. 产品概述

### 1.1 产品定位

一款面向高三学生家长的免费AI智能志愿填报助手，通过收集学生多维度信息（基础信息、成绩、个性画像），结合官方公开数据，生成个性化志愿填报建议，每条建议均附带参考来源。

### 1.2 核心价值主张

- **免费使用**：降低用户使用门槛，仅供亲友使用
- **AI + 参考来源**：建议有理有据，值得信赖
- **多维度画像**：不仅看分数，更关注学生个体差异
- **灵活分析模式**：规则引擎（默认）+ 大模型分析（可选）
- **精准省份覆盖**：专注新高考3+1+2省份

### 1.3 目标用户

- 高三学生家长（主要操作者）
- 高三学生（参与者）

### 1.4 目标市场

**首期覆盖省份（新高考3+1+2模式）**：
- 广东省、湖南省、湖北省、河北省
- 辽宁省、福建省、江苏省、重庆市

后续可扩展至：新高考3+3省份、传统文理分科省份

### 1.5 平台

- Android（首期）
- 后续可扩展至 iOS

### 1.6 分析模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| 规则引擎 | 基于位次/线差算法的规则分析 | 快速、免费、离线可用 |
| 大模型分析 | 接入通义千问API进行智能分析 | 复杂情况、追问对话 |

用户可选择使用大模型分析（需联网），默认使用规则引擎

---

## 2. 用户角色与业务流程

### 2.1 用户角色

| 角色 | 权限 |
|------|------|
| 游客 | 浏览功能介绍、登录/注册 |
| 注册用户 | 使用全部功能、管理考生档案、查看历史记录 |

### 2.2 核心业务流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          用户核心流程                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │  注册/   │ -> │  添加    │ -> │  输入    │ -> │  个性    │         │
│  │  登录    │    │  考生    │    │  成绩    │    │  画像    │         │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│       │              │              │              │                   │
│       v              v              v              v                   │
│  • 手机号注册      • 姓名          • 高考年份       • 性格测评          │
│  • 微信登录        • 性别          • 高考分数       • 兴趣问答          │
│  • 密码登录        • 科类          • 省排名         • 职业倾向          │
│                    • 省份          • 选科组合          │
│                                                   • 家庭期望           │
│                                                   • 身体条件           │
│                                                                       │
│                              v                                        │
│                     ┌──────────┐                                      │
│                     │  AI推荐  │                                      │
│                     └────┬─────┘                                      │
│                          │                                            │
│                          v                                            │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                        输出内容                                   │ │
│  │  • 冲刺/稳妥/保底院校推荐                                         │ │
│  │  • 专业推荐（含就业前景、行业分析）                                │ │
│  │  • 风险评估（就业风险）                                           │ │
│  │  • 每条建议附带官方参考来源                                       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                          │                                            │
│                          v                                            │
│                     ┌──────────┐                                      │
│                     │  追问/   │                                      │
│                     │  优化    │                                      │
│                     └──────────┘                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 功能模块详细说明

### 3.1 账户管理模块

#### 3.1.1 注册/登录

| 功能 | 说明 |
|------|------|
| 手机号注册 | 输入手机号+验证码+密码 |
| 密码登录 | 手机号+密码 |
| 微信登录 | 一键授权登录（可选） |
| 忘记密码 | 手机验证码重置 |

#### 3.1.2 考生档案管理

| 功能 | 说明 |
|------|------|
| 添加考生 | 一个账户可添加多个考生（支持二孩/三孩家庭） |
| 编辑考生信息 | 修改基本信息 |
| 删除考生 | 逻辑删除，保留历史数据 |
| 切换考生 | 快速切换不同考生档案 |

### 3.2 基础信息模块

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 姓名 | 字符串 | 是 | 考生姓名 |
| 性别 | 选择 | 是 | 男/女 |
| 科类 | 选择 | 是 | 文科/理科/物理/历史/化学/生物/政治/地理（根据省份） |
| 省份 | 选择 | 是 | 高考所在省份 |
| 选科组合 | 多选 | 否 | 新高考省份必填 |
| 身体条件 | 多选 | 否 | 视力/身高/色盲/色弱等限制 |

### 3.3 成绩信息模块（必填）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 高考年份 | 选择 | 是 | 如：2025年 |
| 科类 | 选择 | 是 | 文科/理科/选科组合 |
| 高考总分 | 数字 | 是 | 0-750 |
| 省排名 | 数字 | 是 | 手动输入 |
| 各科分数 | 数字 | 否 | 备用 |

**校验规则**：
- 分数与排名合理性校验
- 提示用户参考省考试院发布的"一分一段表"

### 3.4 个性画像模块（智能问答）

通过交互式问答收集学生特征，问卷形式，每次5-8个问题：

| 维度 | 问题示例 | 收集信息 |
|------|---------|---------|
| 性格 | "孩子更擅长与 人 打交道还是与 数据/机器 打交道？" | INTJ/INTP/ESFJ... |
| 兴趣 | "孩子平时喜欢探索新技术还是喜欢艺术创作？" | 兴趣代码 |
| 职业倾向 | "希望未来工作稳定还是追求高收入？" | 职业倾向 |
| 家庭因素 | "是否希望孩子留在身边发展？" | 地域偏好 |
| 家庭期望 | "对孩子的职业发展有什么期望？" | 开放回答 |

### 3.5 AI智能推荐模块

#### 3.5.1 院校推荐

| 类型 | 说明 |
|------|------|
| 冲刺院校 | 往年位次高于学生1000-2000名 |
| 稳妥院校 | 往年位次与学生相近（±500） |
| 保底院校 | 往年位次低于学生5000名以上 |

**每所院校显示**：
- 院校基本信息（名称、省份、城市、层次）
- 录取数据（近几年分数线/位次）
- 推荐理由
- 风险提示

#### 3.5.2 专业推荐

| 维度 | 说明 |
|------|------|
| 就业导向推荐 | 结合性格+兴趣推荐5-10个专业 |

**每个专业显示**：
- 专业基本信息（名称、门类、学制）
- 就业前景（行业薪资、需求趋势）
- 院校认可度（专业排名、企业认可）

#### 3.5.3 风险评估

| 风险类型 | 规则 | 显示 |
|---------|------|------|
| 就业风险 | 该专业连续2年就业率下降 | 🔴 红色警告 |
| 薪资风险 | 该行业起薪低于平均30% | 🟠 橙色提示 |
| 扩招风险 | 该院校专业连续3年扩招 | ⚪ 蓝色提示 |

### 3.6 参考来源模块

每条建议必须附带官方参考来源：

| 来源类型 | 示例 |
|---------|------|
| 招生章程 | 院校官网/招生网 |
| 往年分数线 | 省教育考试院官方数据 |
| 专业介绍 | 教育部专业目录 |
| 就业数据 | 人社部/统计局公开数据 |
| 学科评估 | 教育部学科评估结果 |

### 3.7 历史记录模块

| 功能 | 说明 |
|------|------|
| 查看历年推荐 | 每个考生每年的推荐记录 |
| 对比分析 | 今年的分数与往年对比 |
| 追问记录 | 历史追问对话 |

### 3.8 追问/优化模块

| 功能 | 说明 |
|------|------|
| 追问原因 | "为什么推荐这个专业？" |
| 调整条件 | "如果我想去一线城市呢？" |
| 重新生成 | 基于新条件重新推荐 |

---

## 4. 非功能需求

### 4.1 性能需求

| 指标 | 要求 |
|------|------|
| 页面加载时间 | < 3秒 |
| AI推荐生成时间 | < 10秒 |
| 并发用户数 | 支持1000+同时在线 |

### 4.2 安全需求

| 需求 | 说明 |
|------|------|
| 数据加密 | 敏感数据加密存储 |
| 隐私保护 | 考生信息仅本人可见 |
| 传输安全 | HTTPS全站加密 |

### 4.3 兼容性

| 平台 | 最低版本 |
|------|---------|
| Android | 8.0 (API 26) |
| iOS | 12.0（后续） |

### 4.4 数据更新

| 数据类型 | 更新频率 |
|---------|---------|
| 高考分数线 | 每年6-8月集中更新 |
| 院校招生章程 | 每年3-5月集中更新 |
| 行业就业数据 | 每年更新 |
| 学科评估数据 | 教育部发布时更新 |

---

## 5. 核心数据模型

### 5.1 用户表 (users)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  wechat_openid VARCHAR(100),
  nickname VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 考生档案表 (students)

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  name VARCHAR(50),
  gender VARCHAR(10),
  province VARCHAR(20),
  category VARCHAR(20),
  subject_combination JSONB,
  physical_conditions JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.3 高考成绩表 (scores)

```sql
CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id),
  year INT,
  category VARCHAR(20),
  total_score INT,
  rank_province INT,
  subject_scores JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.4 学生画像表 (profiles)

```sql
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id),
  personality VARCHAR(50),
  interests JSONB,
  career_preference VARCHAR(100),
  plan_to_postgrad VARCHAR(20),
  family_expectations TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.5 院校数据表 (universities)

```sql
CREATE TABLE universities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  province VARCHAR(20),
  city VARCHAR(50),
  level VARCHAR(20),
  categories JSONB,
  admission_notes TEXT,
  source_urls JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.6 专业数据表 (majors)

```sql
CREATE TABLE majors (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20),
  name VARCHAR(100),
  category VARCHAR(50),
  careers TEXT,
  employment_outlook JSONB,
  postgrad适配性 JSONB,
  source_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.7 历史录取数据表 (admission_records)

```sql
CREATE TABLE admission_records (
  id SERIAL PRIMARY KEY,
  university_id INT REFERENCES universities(id),
  major_id INT REFERENCES majors(id),
  year INT,
  province VARCHAR(20),
  category VARCHAR(20),
  min_score INT,
  min_rank INT,
  source_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.8 行业数据表 (industries)

```sql
CREATE TABLE industries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  salary_trend JSONB,
  demand_trend VARCHAR(20),
  risk_level VARCHAR(20),
  source_url VARCHAR(500),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.9 AI推荐结果表 (recommendations)

```sql
CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id),
  score_id INT REFERENCES scores(id),
  rec_type VARCHAR(20),
  university_id INT REFERENCES universities(id),
  major_id INT REFERENCES majors(id),
  reason TEXT,
  risk_warnings JSONB,
  source_refs JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. 风险与挑战

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 数据获取难度 | 高 | 爬虫+官方API混合，先做重点省份 |
| AI推荐准确率 | 中 | 初期用规则引擎，后期接入大模型 |
| 数据更新延迟 | 中 | 定时任务+人工审核 |
| 用户信任度 | 中 | 透明化参考来源，建立信任 |

---

## 7. 里程碑计划

| 阶段 | 时间 | 交付物 |
|------|------|--------|
| M1 | 第1-2周 | 项目框架、技术选型确认 |
| M2 | 第3-4周 | 核心数据采集（首批院校） |
| M3 | 第5-6周 | 后端API开发 |
| M4 | 第7-8周 | 移动端基础功能开发 |
| M5 | 第9-10周 | AI推荐引擎开发 |
| M6 | 第11-12周 | 测试、Bug修复 |
| M7 | 第13周 | 上线、内测 |

---

## 8. 附录

### 8.1 参考数据来源

| 数据 | 来源 |
|------|------|
| 高考分数线 | 各省教育考试院官网 |
| 院校招生章程 | 阳光高考网、各院校官网 |
| 专业目录 | 教育部高等教育司 |
| 学科评估 | 教育部学位与研究生教育发展中心 |
| 就业数据 | 统计局、BOSS直聘、智联招聘 |

### 8.2 术语表

| 术语 | 定义 |
|------|------|
| 位次法 | 根据省排名换算录取概率的方法 |
| 线差法 | 根据分数与省控线差值的方法 |
| 学科评估 | 教育部对高校学科建设水平的评估 |
| 报录比 | 报考人数与录取人数之比 |
| 滑档 | 因志愿填报不当导致未被录取 |
