import { PrismaClient } from "@prisma/client";
import { backgroundImages } from "./background-images-data.js";

const prisma = new PrismaClient();

async function main() {
  console.log(`开始写入 ${backgroundImages.length} 张背景图...`);

  const categories = [...new Set(backgroundImages.map((image) => image.category))];

  await prisma.backgroundImage.deleteMany({
    where: {
      category: {
        in: categories,
      },
    },
  });

  await prisma.backgroundImage.createMany({
    data: backgroundImages,
  });

  console.log(`✓ 背景图种子数据写入完成: ${backgroundImages.length} 条`);
}

main()
  .catch((error) => {
    console.error("❌ 背景图种子数据写入失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
