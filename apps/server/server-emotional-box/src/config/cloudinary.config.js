import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // 使用 HTTPS
});

// 验证配置
const validateConfig = () => {
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Cloudinary 配置缺失: ${missingVars.join(', ')}\n` +
      `   请在 .env 文件中配置这些环境变量`
    );
    return false;
  }

  console.log('✓ Cloudinary 配置成功');
  return true;
};

// 启动时验证配置
validateConfig();

export default cloudinary;
