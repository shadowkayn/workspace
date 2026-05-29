import express from 'express';
import multer from 'multer';
import { UploadController } from '../controller/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// 配置 multer（内存存储）
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 上传用户头像
router.post('/avatar', authenticate, upload.single('avatar'), UploadController.uploadAvatar);

// 上传通用图片
router.post('/image', authenticate, upload.single('image'), UploadController.uploadImage);

// 获取缓存统计
router.get('/stats', authenticate, UploadController.getCacheStats);

export default router;
