# T101: Railway 后端部署指南

## 概述

本文档指导如何将高考志愿填报助手后端服务部署到 Railway 平台。

## 前置条件

- [x] T102 云数据库已创建（Neon PostgreSQL）
- [x] T104 环境变量已配置
- [x] GitHub 账号
- [x] Railway 账号（可使用 GitHub 登录）

## 部署步骤

### 1. 准备代码

确保代码已推送到 GitHub：

```bash
git add .
git commit -m "prepare for railway deployment"
git push origin master
```

### 2. 登录 Railway

1. 访问 https://railway.app/
2. 点击 "Login" 使用 GitHub 账号登录

### 3. 创建新项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择 `Zhiyuan` 仓库
4. 选择 `backend` 目录作为项目根目录

### 4. 配置环境变量

在 Railway 项目设置中，添加以下环境变量：

#### 必需变量

```env
# 数据库
DATABASE_URL=postgresql://neondb_owner:npg_du5TaptVfsP8@ep-wild-base-a1tvdx19-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# 服务器
NODE_ENV=production
PORT=3000

# JWT
JWT_SECRET=zhiyuan-jwt-secret-key-2024-production-env
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 短信服务（模拟模式）
SMS_PROVIDER=mock
SMS_MOCK_FIXED_CODE=123456
```

#### 可选变量

```env
# 数据库连接池
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=10000

# 安全配置
PASSWORD_SALT_ROUNDS=10
SESSION_TIMEOUT=24
FORCE_HTTPS=true
```

### 5. 部署设置

在 Railway 项目设置中：

1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Healthcheck Path**: `/api/health`

### 6. 启动部署

1. 点击 "Deploy" 按钮
2. 等待构建完成（约 2-3 分钟）
3. 查看部署日志

### 7. 验证部署

部署成功后，访问健康检查端点：

```bash
curl https://your-app-name.railway.app/api/health
```

预期响应：

```json
{
  "status": "ok",
  "message": "API服务正常运行",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### 8. 测试 API

测试发送验证码接口：

```bash
curl -X POST https://your-app-name.railway.app/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138000"}'
```

预期响应：

```json
{
  "success": true,
  "message": "验证码发送成功（模拟）",
  "debugCode": "123456",
  "provider": "mock"
}
```

## 故障排查

### 数据库连接失败

**症状**: 应用启动失败，日志显示数据库连接错误

**解决**:
1. 检查 `DATABASE_URL` 是否正确
2. 确认 Neon 数据库允许 Railway IP 访问
3. 检查 SSL 配置

### 健康检查失败

**症状**: Railway 显示部署失败，健康检查超时

**解决**:
1. 检查 `PORT` 环境变量是否设置为 `3000`
2. 确认应用监听 `process.env.PORT`
3. 查看应用日志定位错误

### 环境变量未生效

**症状**: 应用使用默认值而非设置的环境变量

**解决**:
1. 在 Railway 中重新保存环境变量
2. 重新部署应用
3. 检查变量名是否正确

## 重要提示

### 安全注意事项

1. **JWT_SECRET**: 生产环境务必修改为强密码
2. **数据库密码**: 定期更换 Neon 数据库密码
3. **环境变量**: 不要将敏感信息提交到 Git

### 后续步骤

部署成功后，继续进行：
- T100: Vercel 前端部署
- T103: 域名/SSL 配置
- T105: 灰度发布
- T106: 正式发布

## 参考链接

- Railway 文档: https://docs.railway.app/
- Neon 文档: https://neon.tech/docs/
