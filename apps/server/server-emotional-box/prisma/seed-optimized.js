import { PrismaClient } from "@prisma/client";
import { quotesOptimized } from "./quotes-data-optimized.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 开始使用优化后的名人名言更新数据库...");

  // 检查语录数量
  console.log(`📚 优化后的语录库有 ${quotesOptimized.length} 条名人名言`);
  
  // 清空现有数据（先删除关联的收藏记录）
  console.log("🗑️  清空现有数据...");
  await prisma.userFavorite.deleteMany();
  console.log("✓ 已清空收藏记录");
  await prisma.quote.deleteMany();
  console.log("✓ 已清空语录数据");

  // 生成从今天开始的数据
  const startDate = new Date("2026-06-12"); // 从今天开始
  const quotesToInsert = [];

  // 使用优化后的语录，如果不够就循环使用
  for (let i = 0; i < 730; i++) {
    const displayDate = new Date(startDate);
    displayDate.setDate(startDate.getDate() + i);

    // 循环使用语录，如果超过365条就重新开始
    const quoteIndex = i % quotesOptimized.length;
    const quote = quotesOptimized[quoteIndex];

    quotesToInsert.push({
      content: quote.content,
      author: quote.author,
      category: quote.category,
      displayDate,
    });
  }

  // 批量插入
  console.log("📝 正在插入数据...");
  let insertedCount = 0;
  for (const quote of quotesToInsert) {
    await prisma.quote.create({
      data: quote,
    });
    insertedCount++;
    if (insertedCount % 100 === 0) {
      console.log(`   已插入 ${insertedCount}/${quotesToInsert.length} 条...`);
    }
  }

  console.log(`\n✅ 成功生成 ${quotesToInsert.length} 条语录！`);
  console.log(`📅 开始日期: 2026-06-12`);
  console.log(`📅 结束日期: 2028-06-11`);
  console.log(`👥 包含的名人: 尼采、叔本华、爱比克泰德、托尔斯泰、罗曼·罗兰、泰戈尔、卡夫卡、纪伯伦、马克·吐温、村上春树、王尔德、海明威、加缪、黑塞、柏拉图、亚里士多德、苏格拉底等`);
  console.log(`🎯 所有语录都是有深度的名人名言，告别"佚名"！`);
}

main()
  .catch((e) => {
    console.error("❌ 种子数据生成失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
