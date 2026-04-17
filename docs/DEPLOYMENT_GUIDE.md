# 部署指南

## T102 + T104: 云数据库创建与环境变量配置

---

## 一、云数据库创建 (T102)

### 1.1 创建 Neon PostgreSQL 数据库

#### 步骤 1: 注册 Neon 账户
1. 访问 [https://console.neon.tech/sign_in](https://console.neon.tech/sign_in)
2. 使用 GitHub 账号登录（推荐）
3. 完成邮箱验证

#### 步骤 2: 创建项目
1. 点击 **"New Project"**
2. 项目名称填写：`zhiyuan-prod`
3. 选择区域：
   - **推荐**: `Singapore (Asia)` - 距离中国最近，延迟最低
   - 备选: `US East (N. Virginia)`
4. 数据库名称：`zhiyuan_prod`
5. 点击 **"Create Project"**

#### 步骤 3: 获取连接字符串
创建完成后，Neon 会显示连接信息：

```
postgresql://[username]:[password]@[hostname]/zhiyuan_prod?sslmode=require
```

**⚠️ 重要**: 请复制并保存这个连接字符串，后续配置需要用到。

#### 步骤 4: 执行数据库迁移

**方式一：通过 Neon 控制台执行**
1. 在 Neon 控制台点击 **"SQL Editor"**
2. 复制 `backend/database/migrate-prod.sql` 文件内容
3. 粘贴到 SQL Editor 中
4. 点击 **"Run"** 执行

**方式二：通过 psql 命令行执行**
```bash
# 安装 PostgreSQL 客户端（如果未安装）
# macOS: brew install postgresql
# Windows: 下载安装包

# 执行迁移脚本
psql "postgresql://username:password@hostname/zhiyuan_prod?sslmode=require" -f backend/database/migrate-prod.sql
```

#### 步骤 5: 验证数据库
执行以下 SQL 验证表是否创建成功：
```sql
\dt
-- 应该显示 12 个表
```

---

## 二、环境变量配置 (T104)

### 2.1 后端环境变量配置

#### 步骤 1: 创建生产环境配置文件

在 `backend` 目录下创建 `.env.production` 文件：

```bash
cd backend
cp .env.example .env.production
```

#### 步骤 2: 编辑环境变量

使用文本编辑器打开 `.env.production`，填写以下 **必填项**：

```env
# ============================================
# 必填配置
# ============================================

# 数据库连接字符串（从 Neon 控制台获取）
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/zhiyuan_prod?sslmode=require

# JWT密钥（生成强密码，至少32位）
# 可以使用: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# 短信服务配置（选择阿里云或腾讯云）
SMS_PROVIDER=aliyun
SMS_ACCESS_KEY_ID=your-access-key-id
SMS_ACCESS_KEY_SECRET=your-access-key-secret
SMS_SIGN_NAME=志愿填报助手
SMS_TEMPLATE_CODE=SMS_12345678

# 服务器配置
NODE_ENV=production
PORT=3000
```

#### 步骤 3: 生成 JWT 密钥

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

将生成的密钥填入 `JWT_SECRET`

#### 步骤 4: 配置短信服务

**阿里云短信服务配置：**
1. 登录 [阿里云控制台](https://www.aliyun.com/)
2. 进入 **短信服务**
3. 获取 AccessKey ID 和 AccessKey Secret
4. 申请短信签名（如：志愿填报助手）
5. 申请短信模板（验证码模板）
6. 将相关信息填入环境变量

**腾讯云短信服务配置（备选）：**
1. 登录 [腾讯云控制台](https://cloud.tencent.com/)
2. 进入 **短信** 服务
3. 获取 SecretId 和 SecretKey
4. 创建短信签名和模板
5. 获取 SDK AppID

---

### 2.2 前端环境变量配置

#### 步骤 1: 创建生产环境配置文件

在 `frontend` 目录下创建 `.env.production` 文件：

```bash
cd frontend
cp .env.example .env.production
```

#### 步骤 2: 编辑环境变量

```env
# API基础URL（Railway部署后获得，暂时留空）
API_BASE_URL=https://your-railway-app-url.railway.app/api

# 应用配置
APP_NAME=志愿填报助手
APP_VERSION=1.0.0
APP_ENV=production

# 功能开关
ENABLE_AI_CHAT=true
ENABLE_EXPORT=true
ENABLE_SHARE=false
```

**注意**: `API_BASE_URL` 需要在 Railway 部署后回填。

---

## 三、配置验证清单

### 3.1 数据库验证 ✅

- [ ] Neon 项目已创建
- [ ] 数据库 `zhiyuan_prod` 已创建
- [ ] 连接字符串已保存
- [ ] 迁移脚本已执行
- [ ] 12 张表已创建
- [ ] 索引已创建
- [ ] 触发器已创建

### 3.2 后端环境变量验证 ✅

- [ ] `.env.production` 文件已创建
- [ ] `DATABASE_URL` 已配置（Neon连接字符串）
- [ ] `JWT_SECRET` 已配置（32位以上强密码）
- [ ] `SMS_ACCESS_KEY_ID` 已配置
- [ ] `SMS_ACCESS_KEY_SECRET` 已配置
- [ ] `SMS_SIGN_NAME` 已配置
- [ ] `SMS_TEMPLATE_CODE` 已配置
- [ ] `NODE_ENV=production` 已设置

### 3.3 前端环境变量验证 ✅

- [ ] `.env.production` 文件已创建
- [ ] `API_BASE_URL` 已预留（待Railway部署后回填）
- [ ] `APP_ENV=production` 已设置

---

## 四、敏感信息安全提示

### ⚠️ 重要安全提醒

1. **不要将 `.env.production` 提交到 Git**
   ```bash
   # 确保 .gitignore 中包含
   .env.production
   .env.local
   ```

2. **保护好数据库密码**
   - 不要截图分享连接字符串
   - 不要通过邮件发送密码
   - 定期轮换密码

3. **JWT 密钥安全**
   - 生产环境使用随机生成的强密码
   - 定期更换 JWT 密钥
   - 不要与开发环境共用密钥

4. **短信服务密钥**
   - 限制短信服务的 IP 白名单
   - 开启操作日志
   - 设置消费告警

---

## 五、下一步操作

完成 T102 和 T104 后，您需要提供以下信息给我：

1. **数据库连接字符串**（用于验证连接）
2. **确认迁移脚本执行成功**
3. **JWT 密钥**（用于配置 Railway）

然后我们将进入 **T101: Railway 后端部署**

---

## 六、常见问题

### Q1: Neon 免费额度够用吗？
**A**: Neon 免费版提供：
- 500 MB 存储
- 每月 190 小时计算时间
- 1 个项目，10 个分支

对于初期产品足够使用，用户增长后可升级到付费版。

### Q2: 数据库连接失败怎么办？
**A**: 
1. 检查连接字符串是否正确
2. 确认网络可以访问 Neon 服务器
3. 检查 SSL 模式是否为 `require`
4. 查看 Neon 控制台的数据库状态

### Q3: 短信服务必须配置吗？
**A**: 是的，注册和登录功能依赖短信验证码。可以选择：
- 阿里云短信（推荐）
- 腾讯云短信
- 其他短信服务商

### Q4: 开发环境和生产环境如何区分？
**A**: 
- 开发环境：`.env.development` 或 `.env`
- 生产环境：`.env.production`
- 通过 `NODE_ENV` 环境变量区分

---

## 七、联系支持

如果在配置过程中遇到问题：
1. 查看 Neon 官方文档：https://neon.tech/docs
2. 查看 Railway 官方文档：https://docs.railway.app
3. 随时向我提问

---

**配置完成时间预估**: 30-60 分钟（取决于短信服务申请审核时间）
