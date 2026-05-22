# Emotional Box API Server

情绪宝盒后端服务 - 基于 Express + Prisma + PostgreSQL 的 RESTful API

## 📋 目录

- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [API 文档](#api-文档)
- [环境变量](#环境变量)
- [开发指南](#开发指南)

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 并重命名为 `.env`，然后修改配置：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/emotiondb?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
NODE_ENV="development"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# （可选）查看数据库
pnpm prisma:studio
```

### 4. 启动服务器

```bash
# 开发环境
pnpm dev

# 生产环境
pnpm start
```

服务器将在 `http://localhost:3000` 启动

---

## 📁 项目结构

```
src/
├── app.js                      # 应用入口文件
├── controller/                 # 控制器层（处理 HTTP 请求）
│   └── user.controller.js
├── service/                    # 业务逻辑层
│   └── user.service.js
├── repository/                 # 数据访问层
│   └── user.repository.js
├── router/                     # 路由配置
│   ├── index.js               # 路由入口
│   └── user.router.js         # 用户路由
├── middleware/                 # 中间件
│   ├── auth.middleware.js     # 认证和权限
│   ├── errorHandler.middleware.js  # 错误处理
│   ├── logger.middleware.js   # 日志记录
│   ├── rateLimit.middleware.js     # 限流
│   └── validation.middleware.js    # 参数验证
├── db/                        # 数据库连接
│   └── index.js
└── utils/                     # 工具函数
    └── catchAsync.js

docs/                          # 文档
├── ARCHITECTURE.md            # 架构说明
├── MIDDLEWARE_GUIDE.md        # 中间件指南
├── AUTH_FLOW.md              # 认证流程
└── USER_API_EXAMPLES.md      # API 示例

prisma/                        # Prisma 配置
└── schema.prisma             # 数据库模型
```

---

## 📚 API 文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

### 健康检查

#### GET /health

检查服务器运行状态

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2026-05-08T10:30:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```

### 用户相关接口

#### POST /api/users/wechat-login

微信小程序登录/注册

**请求体：**
```json
{
  "openid": "oABC123xyz",
  "nickname": "张三",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "clx1234567890",
      "openid": "oABC123xyz",
      "nickname": "张三",
      "avatarUrl": "https://example.com/avatar.jpg",
      "createdAt": "2026-05-08T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /api/users/me

获取当前登录用户信息（需要认证）

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "clx1234567890",
    "openid": "oABC123xyz",
    "nickname": "张三",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

#### GET /api/users

获取用户列表（需要认证，支持分页）

**请求头：**
```
Authorization: Bearer <token>
```

**查询参数：**
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 10，最大 100）

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### GET /api/users/:id

获取单个用户详情（需要认证）

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "clx1234567890",
    "openid": "oABC123xyz",
    "nickname": "张三",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-05-08T10:30:00.000Z"
  }
}
```

#### PUT /api/users/:id

更新用户信息（需要认证，只能更新自己的信息）

**请求头：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "nickname": "新昵称",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "用户信息更新成功",
  "data": {
    "id": "clx1234567890",
    "openid": "oABC123xyz",
    "nickname": "新昵称",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "createdAt": "2026-05-08T10:30:00.000Z"
  }
}
```

---

## 🔧 环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | - | ✅ |
| `JWT_SECRET` | JWT 密钥 | - | ✅ |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` | ❌ |
| `PORT` | 服务器端口 | `3000` | ❌ |
| `HOST` | 服务器主机 | `0.0.0.0` | ❌ |
| `NODE_ENV` | 运行环境 | `development` | ❌ |
| `CORS_ORIGIN` | CORS 允许的来源 | `*` | ❌ |
| `WECHAT_APP_ID` | 微信小程序 AppID | - | ❌ |
| `WECHAT_APP_SECRET` | 微信小程序 AppSecret | - | ❌ |

---

## 💻 开发指南

### 可用脚本

```bash
# 开发环境启动
pnpm dev

# 生产环境启动
pnpm start

# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 打开 Prisma Studio（数据库可视化工具）
pnpm prisma:studio

# 运行数据库种子（如果有）
pnpm prisma:seed
```

### 测试 API

#### 使用 curl

```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试登录
curl -X POST http://localhost:3000/api/users/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"openid":"test123","nickname":"测试用户"}'

# 测试获取当前用户（需要替换 token）
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 使用 Postman/Apifox

1. 导入 API 端点
2. 设置环境变量 `baseUrl = http://localhost:3000`
3. 在 Authorization 中选择 Bearer Token
4. 依次测试各个接口

### 添加新的路由模块

1. **创建 Repository**（数据访问层）

```javascript
// src/repository/quote.repository.js
import prisma from "../db/index.js";

export const QuoteRepository = {
  async create(data) {
    return await prisma.quote.create({ data });
  },
  
  async findMany({ skip, take }) {
    return await prisma.quote.findMany({ skip, take });
  },
};
```

2. **创建 Service**（业务逻辑层）

```javascript
// src/service/quote.service.js
import { QuoteRepository } from "../repository/quote.repository.js";

export const QuoteService = {
  async createQuote(data) {
    // 业务逻辑验证
    if (!data.content) {
      throw new Error("内容不能为空");
    }
    
    return await QuoteRepository.create(data);
  },
};
```

3. **创建 Controller**（控制器层）

```javascript
// src/controller/quote.controller.js
import { QuoteService } from "../service/quote.service.js";
import { catchAsync } from "../utils/catchAsync.js";

export const QuoteController = {
  createQuote: catchAsync(async (req, res) => {
    const quote = await QuoteService.createQuote(req.body);
    res.status(201).json({ code: 201, data: quote });
  }),
};
```

4. **创建 Router**（路由配置）

```javascript
// src/router/quote.router.js
import express from "express";
import { QuoteController } from "../controller/quote.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, QuoteController.createQuote);

export default router;
```

5. **注册路由**

```javascript
// src/router/index.js
import quoteRouter from "./quote.router.js";

const routes = {
  "/users": userRouter,
  "/quotes": quoteRouter,  // 新增
};
```

### 数据库操作

```bash
# 创建新的迁移
pnpm prisma migrate dev --name add_new_table

# 重置数据库（危险操作！）
pnpm prisma migrate reset

# 查看数据库
pnpm prisma studio
```

---

## 🔒 安全建议

1. **生产环境必须修改 JWT_SECRET**
2. **使用 HTTPS**
3. **设置具体的 CORS_ORIGIN**
4. **定期更新依赖包**
5. **不要提交 .env 文件到 Git**

---

## 📖 详细文档

- [三层架构说明](./docs/ARCHITECTURE.md)
- [中间件使用指南](./docs/MIDDLEWARE_GUIDE.md)
- [认证流程指南](./docs/AUTH_FLOW.md)
- [API 使用示例](./docs/USER_API_EXAMPLES.md)

---

## 🐛 常见问题

### Q: 启动时报错 "Cannot find module"

**A:** 运行 `pnpm install` 安装依赖

### Q: 数据库连接失败

**A:** 检查 `.env` 中的 `DATABASE_URL` 是否正确，确保 PostgreSQL 服务已启动

### Q: Token 验证失败

**A:** 检查请求头中的 `Authorization` 格式是否为 `Bearer <token>`

### Q: 如何查看数据库内容

**A:** 运行 `pnpm prisma:studio` 打开可视化工具

---

## 📝 License

ISC

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！
