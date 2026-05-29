import { UploadService } from '../service/upload.service.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * Upload Controller - 文件上传控制器
 */
export const UploadController = {
  /**
   * 上传头像
   * POST /api/upload/avatar
   */
  uploadAvatar: asyncHandler(async (req, res) => {
    // 从请求中获取用户 ID（通过 JWT 认证中间件注入）
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权',
      });
    }

    // 检查是否有文件
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件',
      });
    }

    // 验证文件类型
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: '只支持 JPG、PNG、WEBP 格式的图片',
      });
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: '图片大小不能超过 5MB',
      });
    }

    // 上传到 Cloudinary
    const avatarUrl = await UploadService.uploadAvatar(req.file.buffer, userId, {
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    res.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatarUrl,
      },
    });
  }),

  /**
   * 获取缓存统计
   * GET /api/upload/stats
   */
  getCacheStats: asyncHandler(async (req, res) => {
    const stats = await UploadService.getCacheStats();

    res.json({
      success: true,
      data: {
        ...stats,
        savedSpace: stats.totalSize * (stats.savedUploads / stats.totalUploads || 0),
        deduplicationRate: stats.totalUploads > 0 
          ? ((stats.savedUploads / stats.totalUploads) * 100).toFixed(2) + '%'
          : '0%',
      },
    });
  }),

  /**
   * 上传通用图片
   * POST /api/upload/image
   */
  uploadImage: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件',
      });
    }

    // 验证文件类型
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: '只支持 JPG、PNG、WEBP 格式的图片',
      });
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: '图片大小不能超过 10MB',
      });
    }

    // 上传到 Cloudinary
    const result = await UploadService.uploadImage(req.file.buffer, {
      folder: req.body.folder || 'emotional-box/images',
    });

    res.json({
      success: true,
      message: '图片上传成功',
      data: result,
    });
  }),
};
