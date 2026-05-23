# Emotional Box API Server

情绪盒子小程序后端服务

## 📋 项目简介

这是一个基于 Node.js + Express + Prisma + PostgreSQL 的情绪日记小程序后端服务，支持微信小程序登录、情绪日记记录、每日治愈语录等功能。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/emotiondb?schema=public"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# 服务器配置
PORT=3000
NODE_ENV="development"

# 微信小程序配置（可选）
WECHAT_APP_ID="your_app_id"
WECHAT_APP_SECRET="your_app_secret"
```

### 数据库迁移

```bash
# 执行数据库迁移
pnpm prisma migrate dev

# 生成种子数据（730条治愈语录）
pnpm seed
```

### 启动服务

```bash
# 开发环境
pnpm dev

# 生产环境
pnpm start
```

服务器将在 `http://localhost:3000` 启动

## 📚 API 文档

### 健康检查

```
GET /health
```

### 用户模块

- `POST /api/users/wechat-login` - 微信小程序登录
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/:id` - 更新用户信息

### 语录模块

- `GET /api/quotes/today` - 获取今日语录
- `GET /api/quotes/date/:date` - 按日期获取语录
- `GET /api/quotes` - 获取语录列表（分页）
- `GET /api/quotes/:id` - 获取语录详情

### 情绪日记模块

- `POST /api/mood-records` - 创建情绪日记
- `GET /api/mood-records` - 获取我的日记列表（分页）
- `GET /api/mood-records/:id` - 获取日记详情
- `PUT /api/mood-records/:id` - 更新日记
- `DELETE /api/mood-records/:id` - 删除日记
- `GET /api/mood-records/recent` - 获取最近的日记
- `GET /api/mood-records/recent-days?days=7` - 获取近N天的情绪记录
- `GET /api/mood-records/date/:date` - 按日期查询日记
- `GET /api/mood-records/stats` - 获取情绪统计

详细 API 文档请查看 [docs/API.md](./docs/API.md)

## 🔐 认证

大部分接口需要 JWT 认证，请在请求头中添加：

```
Authorization: Bearer <token>
```

## 🏗️ 项目结构

```
src/
├── app.js                  # 应用入口
├── db/                     # 数据库配置
│   ├── prisma.js          # Prisma Client
│   ├── connect.js         # 连接管理
│   └── index.js           # 统一导出
├── middleware/            # 中间件
│   ├── auth.middleware.js        # 认证中间件
│   ├── errorHandler.middleware.js # 错误处理
│   ├── logger.middleware.js      # 日志中间件
│   ├── rateLimit.middleware.js   # 限流中间件
│   └── validation.middleware.js  # 参数验证
├── repository/            # 数据访问层
│   ├── user.repository.js
│   ├── quote.repository.js
│   └── moodRecord.repository.js
├── service/              # 业务逻辑层
│   ├── user.service.js
│   ├── wechat.service.js
│   ├── quote.service.js
│   └── moodRecord.service.js
├── controller/           # 控制器层
│   ├── user.controller.js
│   ├── quote.controller.js
│   └── moodRecord.controller.js
└── router/              # 路由配置
    ├── index.js
    ├── user.router.js
    ├── quote.router.js
    └── moodRecord.router.js

prisma/
├── schema.prisma        # 数据库模型
├── migrations/          # 数据库迁移文件
├── seed.js             # 种子数据脚本
└── quotes-data.js      # 语录数据
```

## 🛠️ 技术栈

- **框架**: Express.js
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: JWT
- **验证**: 自定义验证中间件
- **日志**: 自定义日志中间件
- **限流**: express-rate-limit

## 📖 开发文档

- [微信登录接入文档](./docs/WECHAT_LOGIN.md)
- [数据库设计文档](./docs/DATABASE.md)
- [API 接口文档](./docs/API.md)

## 🧪 测试

```bash
# 运行测试脚本
./test-mood-api.sh
./test-recent-days.sh
```

## 📝 数据库模型

### User (用户)
- id: 用户ID
- openid: 微信openid
- nickname: 昵称
- avatarUrl: 头像URL
- createdAt: 创建时间

### Quote (语录)
- id: 语录ID
- content: 语录内容
- author: 作者
- category: 分类
- displayDate: 展示日期（唯一）
- createdAt: 创建时间

### MoodRecord (情绪日记)
- id: 日记ID
- userId: 用户ID
- title: 标题
- content: 内容
- mood: 情绪类型 (happy/sad/anxious/calm/excited/angry/tired/peaceful)
- moodScore: 情绪强度 (1-10)
- tags: 标签数组
- weather: 天气
- location: 地点
- isPrivate: 是否私密
- createdAt: 创建时间
- updatedAt: 更新时间

## 🔒 安全性

- JWT Token 认证
- 密码加密存储
- SQL 注入防护（Prisma ORM）
- XSS 防护
- CORS 配置
- 请求限流
- 参数验证

## 📦 部署

### 使用 Docker

```bash
# 构建镜像
docker build -t emotional-box-api .

# 运行容器
docker run -p 3000:3000 --env-file .env emotional-box-api
```

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start src/app.js --name emotional-box-api

# 查看日志
pm2 logs emotional-box-api

# 重启服务
pm2 restart emotional-box-api
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👥 作者

Kayn

## 📞 联系方式

如有问题，请提交 Issue 或联系作者。
