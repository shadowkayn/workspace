import securityService from '../service/security.service.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * 内容安全检测 Controller
 */
class SecurityController {
  /**
   * 检测文本内容安全
   */
  checkText = catchAsync(async (req, res) => {
    const { content, contentType = 'text' } = req.body;
    const userId = req.user?.id || null;

    const result = await securityService.checkTextSecurity(
      content,
      userId,
      contentType
    );

    res.json({
      code: 200,
      message: '检测完成',
      data: result
    });
  });
}

export default new SecurityController();
