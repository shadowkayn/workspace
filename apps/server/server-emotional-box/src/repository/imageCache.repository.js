import { prisma } from '../db/index.js';

/**
 * ImageCache Repository - 图片缓存数据访问层
 */
export const ImageCacheRepository = {
  /**
   * 根据文件哈希查找缓存
   * @param {string} fileHash - 文件 MD5 哈希值
   * @returns {Promise<Object|null>}
   */
  async findByHash(fileHash) {
    return await prisma.imageCache.findUnique({
      where: { fileHash },
    });
  },

  /**
   * 创建缓存记录
   * @param {Object} data - 缓存数据
   * @returns {Promise<Object>}
   */
  async create(data) {
    return await prisma.imageCache.create({
      data,
    });
  },

  /**
   * 增加上传次数
   * @param {string} fileHash - 文件哈希值
   * @returns {Promise<Object>}
   */
  async incrementUploadCount(fileHash) {
    return await prisma.imageCache.update({
      where: { fileHash },
      data: {
        uploadCount: {
          increment: 1,
        },
      },
    });
  },

  /**
   * 获取缓存统计
   * @returns {Promise<Object>}
   */
  async getStats() {
    const [total, totalSize, totalSaved] = await Promise.all([
      prisma.imageCache.count(),
      prisma.imageCache.aggregate({
        _sum: { fileSize: true },
      }),
      prisma.imageCache.aggregate({
        _sum: { uploadCount: true },
      }),
    ]);

    return {
      totalImages: total,
      totalSize: totalSize._sum.fileSize || 0,
      totalUploads: totalSaved._sum.uploadCount || 0,
      savedUploads: (totalSaved._sum.uploadCount || 0) - total,
    };
  },
};
