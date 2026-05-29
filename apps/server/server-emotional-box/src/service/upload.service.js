import cloudinary from '../config/cloudinary.config.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import CryptoJS from 'crypto-js';
import { ImageCacheRepository } from '../repository/imageCache.repository.js';

/**
 * Upload Service - 文件上传服务
 */
export const UploadService = {
  /**
   * 计算文件哈希值（MD5）
   * @param {Buffer} buffer - 文件 Buffer
   * @returns {string} MD5 哈希值
   */
  calculateFileHash(buffer) {
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    return CryptoJS.MD5(wordArray).toString();
  },

  /**
   * 上传图片到 Cloudinary（带去重）
   * @param {Buffer|string} file - 文件 Buffer 或 base64 字符串
   * @param {Object} options - 上传选项
   * @param {string} [options.folder] - 上传文件夹
   * @param {string} [options.publicId] - 自定义文件名
   * @param {string} [options.resourceType='image'] - 资源类型
   * @param {string} [options.mimeType] - 文件类型
   * @param {number} [options.fileSize] - 文件大小
   * @returns {Promise<Object>} 上传结果
   */
  async uploadImage(file, options = {}) {
    try {
      // 1. 计算文件哈希值
      const fileBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file, 'base64');
      const fileHash = this.calculateFileHash(fileBuffer);

      // 2. 检查缓存是否存在
      const cachedImage = await ImageCacheRepository.findByHash(fileHash);

      if (cachedImage) {
        // 缓存命中！直接返回已有 URL
        console.log(`✓ 图片去重命中: ${fileHash} (节省上传)`);
        
        // 增加上传次数统计
        await ImageCacheRepository.incrementUploadCount(fileHash);

        return {
          url: cachedImage.cloudinaryUrl,
          publicId: cachedImage.publicId,
          width: cachedImage.width,
          height: cachedImage.height,
          size: cachedImage.fileSize,
          cached: true, // 标记为缓存命中
          uploadCount: cachedImage.uploadCount + 1,
        };
      }

      // 3. 缓存未命中，上传到 Cloudinary
      console.log(`⬆️  上传新图片: ${fileHash}`);

      const uploadOptions = {
        folder: options.folder || process.env.CLOUDINARY_UPLOAD_FOLDER || 'emotional-box/avatars',
        resource_type: options.resourceType || 'image',
        transformation: [
          { width: 500, height: 500, crop: 'limit' }, // 限制最大尺寸
          { quality: 'auto' }, // 自动优化质量
          { fetch_format: 'auto' }, // 自动选择最佳格式
        ],
      };

      // 如果提供了自定义文件名
      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      const result = await this.uploadBuffer(fileBuffer, uploadOptions);

      // 4. 保存到缓存表
      await ImageCacheRepository.create({
        fileHash,
        cloudinaryUrl: result.secure_url,
        publicId: result.public_id,
        fileSize: options.fileSize || result.bytes,
        mimeType: options.mimeType || 'image/jpeg',
        width: result.width,
        height: result.height,
        uploadCount: 1,
      });

      return {
        url: result.secure_url, // HTTPS URL
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        cached: false, // 标记为新上传
        uploadCount: 1,
      };
    } catch (error) {
      console.error('❌ Cloudinary 上传失败:', error);
      throw new AppError('图片上传失败', 500);
    }
  },

  /**
   * 上传 Buffer 到 Cloudinary
   */
  uploadBuffer(buffer, options) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });

      stream.end(buffer);
    });
  },

  /**
   * 上传头像（专用方法）
   * @param {Buffer|string} file - 文件 Buffer 或 base64 字符串
   * @param {string} userId - 用户 ID
   * @param {Object} fileInfo - 文件信息
   * @returns {Promise<string>} 头像 URL
   */
  async uploadAvatar(file, userId, fileInfo = {}) {
    const result = await this.uploadImage(file, {
      folder: 'emotional-box/avatars',
      publicId: `avatar_${userId}_${Date.now()}`,
      mimeType: fileInfo.mimeType,
      fileSize: fileInfo.fileSize,
    });

    return result.url;
  },

  /**
   * 删除图片
   * @param {string} publicId - Cloudinary public_id
   * @returns {Promise<void>}
   */
  async deleteImage(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`✓ 已删除图片: ${publicId}`);
    } catch (error) {
      console.error('❌ 删除图片失败:', error);
      // 删除失败不抛出错误，只记录日志
    }
  },

  /**
   * 从 URL 提取 Cloudinary public_id
   * @param {string} url - Cloudinary URL
   * @returns {string|null} public_id
   */
  extractPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    try {
      // 示例 URL: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
      const parts = url.split('/upload/');
      if (parts.length < 2) return null;

      const pathParts = parts[1].split('/');
      // 移除版本号（v1234567890）
      const withoutVersion = pathParts.filter((part) => !part.startsWith('v'));
      // 移除文件扩展名
      const publicId = withoutVersion.join('/').replace(/\.[^/.]+$/, '');

      return publicId;
    } catch (error) {
      console.error('❌ 提取 public_id 失败:', error);
      return null;
    }
  },

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>}
   */
  async getCacheStats() {
    return await ImageCacheRepository.getStats();
  },
};
