import express from 'express';
import securityController from '../controller/security.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/security/check-text
 * @desc    检测文本内容安全
 * @access  Public（可选登录，登录后记录日志）
 */
router.post('/check-text', authenticate, securityController.checkText);

export default router;
