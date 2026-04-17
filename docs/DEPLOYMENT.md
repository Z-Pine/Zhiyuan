# 云数据库部署指南

## T004: 云数据库环境搭建

### 方案选择

本项目使用 **Neon** 作为PostgreSQL云数据库托管服务。

**选择理由**:
- 免费额度充足（500MB存储 + 190小时计算时间/月）
- 支持分支管理，便于开发和测试
- 自动备份和恢复
- 连接性能好，延迟低
- 与Vercel、Railway集成方便

---

## Neon 数据库创建步骤

### 1. 注册账号

1. 访问 [https://neon.tech](https://neon.tech)
2. 使用GitHub账号登录
3. 创建新的Project

### 2. 创建数据库

1. 点击 "New Project"
2. 项目名称: `zhiyuan-db`
3. 选择地区: `Asia Pacific (Singapore)` 或 `US East (N. Virginia)`
4. 点击 "Create Project"

### 3. 获取连接信息

创建完成后，Neon会提供连接字符串：

```
postgresql://username:password@hostname/database?sslmode=require
```

保存以下信息：
- **Host**: `hostname.neon.tech`
- **Database**: `neondb`
- **User**: `username`
- **Password**: `password`

### 4. 配置环境变量

在项目的 `.env` 文件中配置：

```env
# 生产环境数据库
DATABASE_URL=postgresql://username:password@hostname.neon.tech/neondb?sslmode=require

# 或者分开配置
DB_HOST=hostname.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=username
DB_PASSWORD=password
DB_SSL=true
```

---

## Railway 后端部署

### 1. 注册账号

1. 访问 [https://railway.app](https://railway.app)
2. 使用GitHub账号登录

### 2. 创建项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择 `zhiyuan` 仓库
4. 选择 `backend` 目录

### 3. 添加PostgreSQL服务

1. 点击 "New"
2. 选择 "Database" → "Add PostgreSQL"
3. Railway会自动创建数据库并提供连接信息

### 4. 配置环境变量

在Railway项目设置中添加：

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=2h
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 5. 部署

1. 每次推送到main分支会自动部署
2. 在Deployments页面查看部署状态

---

## Vercel 前端部署

### 1. 注册账号

1. 访问 [https://vercel.com](https://vercel.com)
2. 使用GitHub账号登录

### 2. 导入项目

1. 点击 "Add New Project"
2. 选择 `zhiyuan` 仓库
3. 选择 `frontend` 目录

### 3. 配置构建设置

- **Framework Preset**: Other
- **Build Command**: `flutter build web --release`
- **Output Directory**: `build/web`
- **Install Command**: `flutter pub get`

### 4. 配置环境变量

```
API_BASE_URL=https://your-railway-app.up.railway.app/api
```

### 5. 部署

点击 "Deploy" 开始部署。

---

## 数据库初始化

### 1. 本地初始化

```bash
cd backend
npm run init-db
```

### 2. 生产环境初始化

使用Neon的SQL编辑器或psql命令行：

```bash
# 连接到Neon数据库
psql "postgresql://username:password@hostname.neon.tech/neondb?sslmode=require"

# 执行初始化脚本
\i scripts/init-db.sql
```

---

## 部署检查清单

### 后端部署检查

- [ ] Railway项目创建成功
- [ ] PostgreSQL服务添加完成
- [ ] 环境变量配置正确
- [ ] 自动部署配置完成
- [ ] 健康检查端点可访问
- [ ] API测试通过

### 前端部署检查

- [ ] Vercel项目创建成功
- [ ] 构建设置配置正确
- [ ] 环境变量配置正确
- [ ] 自动部署配置完成
- [ ] 页面可正常访问
- [ ] API调用正常

### 数据库检查

- [ ] Neon数据库创建成功
- [ ] 连接信息获取成功
- [ ] 表结构初始化完成
- [ ] 测试数据导入完成
- [ ] 连接测试通过

---

## 故障排查

### 数据库连接失败

1. 检查DATABASE_URL格式是否正确
2. 确认SSL模式设置为require
3. 检查IP白名单设置
4. 验证用户名密码是否正确

### 部署失败

1. 查看构建日志
2. 检查package.json中的scripts
3. 确认环境变量是否设置
4. 检查端口配置

### API调用失败

1. 检查CORS配置
2. 确认API_BASE_URL正确
3. 检查网络连接
4. 查看后端日志
