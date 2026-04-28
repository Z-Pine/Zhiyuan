# 🚀 快速启动指南

## 📋 前置条件

✅ 已完成基础设施配置  
✅ 数据库已初始化  
✅ 种子数据已导入  

---

## 🎯 启动后端服务

### 1. 进入后端目录
```bash
cd backend
```

### 2. 安装依赖 (如果还没安装)
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

**预期输出**:
```
🚀 Server is running on port 3000
📋 Health check: http://localhost:3000/health
```

---

## 🧪 测试API

### 方法1: 浏览器测试

打开浏览器访问:
```
http://localhost:3000/health
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-23T...",
  "version": "1.0.0",
  "environment": "development"
}
```

### 方法2: 使用curl测试

#### 测试健康检查
```bash
curl http://localhost:3000/health
```

#### 测试登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

**预期响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {...},
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 7200
  }
}
```

#### 测试院校列表
```bash
curl http://localhost:3000/api/schools
```

---

## 📱 测试账号

| 手机号 | 密码 | 说明 |
|--------|------|------|
| 13800138000 | 123456 | 测试用户1 |
| 13800138001 | 123456 | 测试用户2 |

---

## 🔧 常见问题

### Q1: 端口被占用
**错误**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# 方法1: 修改端口
# 编辑 backend/.env 文件
PORT=3001

# 方法2: 关闭占用端口的进程 (Windows)
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F
```

### Q2: 数据库连接失败
**错误**: `Error: connect ECONNREFUSED`

**解决方案**:
1. 检查 `.env` 文件中的 `DATABASE_URL` 是否正确
2. 确认Neon数据库服务正常
3. 检查网络连接

### Q3: JWT密钥错误
**错误**: `Error: secretOrPrivateKey must have a value`

**解决方案**:
确保 `.env` 文件中有 `JWT_SECRET` 配置

---

## 📊 数据库查询

### 查看用户数据
```sql
SELECT * FROM users;
```

### 查看院校数据
```sql
SELECT code, name, province, city, is_985, is_211 
FROM universities 
WHERE province = '广东' 
LIMIT 10;
```

### 查看专业数据
```sql
SELECT code, name, category, subcategory 
FROM majors 
LIMIT 10;
```

---

## 🎨 API端点列表

### 认证相关
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/reset-password` - 重置密码
- `POST /api/auth/refresh-token` - 刷新令牌

### 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 添加学生
- `GET /api/students/:id` - 获取学生详情
- `PUT /api/students/:id` - 更新学生信息
- `DELETE /api/students/:id` - 删除学生

### 成绩管理
- `GET /api/scores` - 获取成绩列表
- `POST /api/scores` - 录入成绩
- `GET /api/scores/:id` - 获取成绩详情

### 院校/专业
- `GET /api/schools` - 获取院校列表
- `GET /api/schools/:id` - 获取院校详情
- `GET /api/majors` - 获取专业列表
- `GET /api/majors/:id` - 获取专业详情

### 推荐系统
- `POST /api/recommendations/generate` - 生成推荐
- `GET /api/recommendations/:id` - 获取推荐详情
- `GET /api/recommendations/student/:studentId` - 获取学生推荐

---

## 🔐 认证流程

### 1. 注册新用户
```bash
# 1. 发送验证码
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900139000"}'

# 2. 注册 (使用控制台显示的验证码)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900139000","password":"123456","code":"验证码"}'
```

### 2. 登录获取Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

### 3. 使用Token访问受保护接口
```bash
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer <你的access_token>"
```

---

## 📈 下一步

1. ✅ 测试所有API端点
2. ✅ 创建测试学生和成绩数据
3. ✅ 测试推荐引擎
4. ✅ 开始前端开发

---

## 💡 开发提示

### 查看日志
后端服务会在控制台输出详细日志:
- 请求日志 (HTTP方法、路径、状态码)
- 数据库查询日志
- 错误日志

### 热重载
使用 `npm run dev` 启动的服务支持热重载，修改代码后会自动重启。

### 调试
在代码中添加 `console.log()` 可以在控制台查看输出。

---

## 📞 需要帮助?

如果遇到问题:
1. 查看控制台错误信息
2. 检查 `backend/SETUP_COMPLETE.md` 文档
3. 查看 `docs/` 目录下的技术文档

---

**祝开发顺利！** 🎉
