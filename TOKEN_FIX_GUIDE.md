# Token传递问题修复指南

## 问题描述
添加学生功能报401 Unauthorized错误，原因是Web平台上FlutterSecureStorage存在兼容性问题，导致token无法正确保存和读取。

## 修复内容

### 1. StorageService改进 (`frontend/lib/services/storage_service.dart`)
- **问题**: Web平台上FlutterSecureStorage可能无法正确工作
- **解决方案**: 
  - Web平台使用SharedPreferences存储token
  - 移动端继续使用FlutterSecureStorage（更安全）
  - 添加详细的日志输出，便于调试

### 2. ApiService增强日志 (`frontend/lib/services/api_service.dart`)
- 在setAuthToken时输出token设置日志
- 在每次API请求时输出Authorization header状态
- 便于追踪token是否正确传递

### 3. AuthService登录验证 (`frontend/lib/services/auth_service.dart`)
- 登录成功后立即验证token是否正确保存
- 对比storage中的token与登录返回的token
- 输出详细的验证日志

### 4. StudentProvider错误处理 (`frontend/lib/providers/student_provider.dart`)
- 添加详细的错误日志
- 特别处理401错误，提示用户重新登录
- 改进错误消息的可读性

## 测试步骤

### 步骤1: 清除浏览器缓存
1. 打开Chrome开发者工具（F12）
2. 进入Application标签
3. 清除所有Storage（Local Storage、Session Storage、IndexedDB等）
4. 刷新页面

### 步骤2: 重新登录
1. 使用测试账号登录：13800138000 / 123456
2. 打开浏览器控制台（Console标签）
3. 查看登录日志，应该看到：
   ```
   ✅ 登录成功，准备保存token...
   🔑 Token已保存到SharedPreferences: eyJhbGciOiJIUzI1NiIs...
   🔐 ApiService: Token已设置到请求头: Bearer eyJhbGciOiJIUzI1NiIs...
   ✅ Token已保存到storage
   ✅ Token已设置到ApiService
   ✅ Token验证成功：storage中的token与登录返回的token一致
   ```

### 步骤3: 添加学生
1. 点击"添加学生"按钮
2. 填写学生信息：
   - 姓名：张三
   - 性别：男
   - 省份：广东
   - 选科类型：物理类
3. 点击"保存"
4. 查看控制台日志，应该看到：
   ```
   📝 准备添加学生: 张三
   📡 POST /api/students, Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   📝 收到响应: statusCode=200
   ✅ 学生添加成功
   ```

### 步骤4: 验证学生列表
1. 返回首页
2. 应该能看到刚添加的学生"张三"
3. 学生列表不应该为空

## 预期结果
- ✅ 登录后token正确保存到SharedPreferences
- ✅ API请求时Authorization header包含正确的token
- ✅ 添加学生成功，返回200状态码
- ✅ 学生列表正确显示新添加的学生

## 如果仍然失败

### 检查点1: Token是否保存
在控制台执行：
```javascript
// 查看localStorage中的token
localStorage.getItem('flutter.auth_token')
```

### 检查点2: API请求头
在Network标签中：
1. 找到POST /api/students请求
2. 查看Request Headers
3. 确认Authorization字段是否存在且格式正确：`Bearer <token>`

### 检查点3: 后端验证
使用后端测试脚本验证API是否正常：
```bash
cd backend
node test-add-student.js
```

## 技术说明

### 为什么Web平台使用SharedPreferences？
- FlutterSecureStorage在Web平台使用Web Crypto API
- 某些浏览器环境下可能不支持或有限制
- SharedPreferences在Web平台使用localStorage，兼容性更好
- 对于Web应用，localStorage的安全性已经足够（HTTPS + HttpOnly cookies）

### Token的生命周期
1. 用户登录 → 后端返回access_token
2. AuthService保存token到StorageService
3. AuthService调用ApiService.setAuthToken()
4. 后续所有API请求自动携带Authorization header
5. 用户退出 → 清除token

## 相关文件
- `frontend/lib/services/storage_service.dart` - Token存储服务
- `frontend/lib/services/api_service.dart` - API请求服务
- `frontend/lib/services/auth_service.dart` - 认证服务
- `frontend/lib/providers/student_provider.dart` - 学生数据管理
- `backend/test-add-student.js` - 后端API测试脚本

## 下一步
如果此修复成功，可以继续完善：
1. 实现token自动刷新机制（T033）
2. 添加token过期提示
3. 实现自动重新登录
