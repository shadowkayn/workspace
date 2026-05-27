import { BackgroundImageRepository } from "../repository/backgroundImage.repository.js";

export const BackgroundImageService = {
  async getBackgroundImages({ limit = 100, category } = {}) {
    const take = Math.min(100, Math.max(1, parseInt(limit) || 100));
    const images = await BackgroundImageRepository.findMany({ take, category });

    return {
      images,
    };
  },
};
