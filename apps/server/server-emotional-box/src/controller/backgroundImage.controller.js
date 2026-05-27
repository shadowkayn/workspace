import { BackgroundImageService } from "../service/backgroundImage.service.js";
import { catchAsync } from "../utils/catchAsync.js";

export const BackgroundImageController = {
  getBackgroundImages: catchAsync(async (req, res) => {
    const { limit, category } = req.query;
    const result = await BackgroundImageService.getBackgroundImages({ limit, category });

    res.json({
      code: 200,
      message: "success",
      data: result,
    });
  }),
};
