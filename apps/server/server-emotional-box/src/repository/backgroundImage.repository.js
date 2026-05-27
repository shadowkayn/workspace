import { prisma } from "../db/index.js";

export const BackgroundImageRepository = {
  async findMany({ skip = 0, take = 100, category } = {}) {
    return await prisma.backgroundImage.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
      },
      skip,
      take,
      orderBy: {
        order: "asc",
      },
    });
  },
};
