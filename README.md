# 志愿填报助手 (Zhiyuan)

> 基于AI的智能高考志愿填报辅助系统

## 项目简介

志愿填报助手是一款专为高考考生和家长设计的智能志愿填报辅助工具。系统通过分析考生的成绩、排名、兴趣偏好等多维度数据，结合历年录取数据和行业发展趋势，为考生提供个性化的院校和专业推荐方案。

## 核心功能

- 🤖 **AI智能推荐**: 基于5大核心算法，生成冲刺/稳妥/保底三档推荐
- 💬 **智能追问**: 支持就推荐结果进行深度对话和追问
- 📊 **风险评估**: 多维度风险评估，包括院校、专业、行业风险
- 📈 **行业分析**: 就业前景、薪资水平、行业发展趋势分析
- 📱 **多端支持**: Web端 + 移动端（Flutter）

## 技术栈

### 后端
- **框架**: Node.js + Express
- **数据库**: PostgreSQL (Neon)
- **认证**: JWT + Refresh Token
- **部署**: Railway

### 前端
- **框架**: Flutter
- **状态管理**: Provider
- **部署**: Vercel

### AI/算法
- 位次分层算法
- 就业匹配算法
- 风险评估算法
- 行业分析算法

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 15
- Flutter >= 3.19

### 安装

1. 克隆项目
```bash
git clone https://github.com/yourusername/zhiyuan.git
cd zhiyuan
```

2. 安装后端依赖
```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 配置数据库连接
```

3. 安装前端依赖
```bash
cd ../frontend
flutter pub get
```

4. 初始化数据库
```bash
cd ../backend
npm run db:init
npm run db:seed
```

5. 启动开发服务器
```bash
# 后端
cd backend
npm run dev

# 前端
cd frontend
flutter run -d chrome
```

## 项目结构

```
zhiyuan/
├── backend/          # 后端服务
│   ├── src/
│   │   ├── config/   # 配置
│   │   ├── middleware/ # 中间件
│   │   ├── routes/   # API路由
│   │   └── services/ # 业务逻辑
│   ├── tests/        # 测试
│   └── scripts/      # 脚本
├── frontend/         # Flutter前端
│   └── lib/
│       ├── pages/    # 页面
│       ├── providers/# 状态管理
│       └── services/ # 服务
└── docs/             # 文档
```

## API文档

详见 [docs/api-test.html](docs/api-test.html)

## 开发规范

详见 [CONTRIBUTING.md](CONTRIBUTING.md)

## 部署

### 后端部署 (Railway)

1. 在 Railway 创建新项目
2. 连接 GitHub 仓库
3. 添加 PostgreSQL 数据库
4. 配置环境变量
5. 部署

### 前端部署 (Vercel)

1. 在 Vercel 导入项目
2. 配置构建命令：`flutter build web`
3. 配置输出目录：`frontend/build/web`
4. 部署

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)

## 联系方式

- 项目主页: https://github.com/yourusername/zhiyuan
- 问题反馈: https://github.com/yourusername/zhiyuan/issues
