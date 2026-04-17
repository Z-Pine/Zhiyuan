# 开发规范

## Git Flow 工作流

### 分支策略

- `main`: 生产环境分支，只接受来自develop的合并
- `develop`: 开发分支，所有功能分支合并到此
- `feature/*`: 功能分支，从develop创建
- `bugfix/*`: 修复分支，从develop创建
- `hotfix/*`: 紧急修复，从main创建

### 提交规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型(type)**:
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式（不影响代码运行的变动）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建过程或辅助工具的变动

**示例**:
```
feat(auth): 添加手机号注册功能

- 实现验证码发送
- 添加用户注册API
- 完善错误处理

Closes #123
```

### 代码审查

- 所有代码必须通过 Pull Request 合并
- 至少需要1个审查者批准
- 必须通过CI检查

## 后端开发规范

### 代码风格

- 使用 ESLint + Prettier
- 2空格缩进
- 单引号
- 行尾分号

### API设计

- RESTful API设计
- 统一响应格式
- 使用语义化的HTTP状态码

### 文件结构

```
backend/
├── src/
│   ├── config/        # 配置
│   ├── middleware/    # 中间件
│   ├── routes/        # 路由
│   ├── services/      # 业务逻辑
│   └── index.js       # 入口
├── tests/             # 测试
└── scripts/           # 脚本
```

## 前端开发规范

### 代码风格

- 使用 Dart 默认格式化
- 使用 const 构造函数
- 避免使用魔法数字

### 状态管理

- 使用 Provider 进行状态管理
- 业务逻辑放在 Provider 中
- UI 只负责展示

### 文件结构

```
frontend/lib/
├── pages/           # 页面
├── providers/       # 状态管理
├── services/        # 服务
├── theme/           # 主题
├── widgets/         # 组件
├── app.dart         # 应用配置
└── main.dart        # 入口
```

## 数据库规范

### 命名规范

- 表名：小写，复数形式，下划线分隔
- 字段名：小写，下划线分隔
- 索引名：idx_表名_字段名

### 字段规范

- 所有表必须包含：id, created_at, updated_at
- 外键字段名：关联表名_id
- 布尔字段：is_前缀

## 测试规范

### 测试覆盖率

- 核心业务逻辑：> 80%
- API接口：> 70%
- UI组件：> 60%

### 测试命名

```
describe('功能模块', () => {
  test('场景描述', () => {
    // 测试代码
  });
});
```

## 文档规范

### API文档

- 使用 JSDoc 注释
- 包含参数说明、返回值、错误码

### 代码注释

- 复杂逻辑必须注释
- 公共API必须注释
- 使用中文注释
