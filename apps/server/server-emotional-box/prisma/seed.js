import { PrismaClient } from "@prisma/client";
import { quotes } from "./quotes-data.js";

const prisma = new PrismaClient();

async function main() {
  console.log("开始生成两年的语录数据...");

  // 检查语录数量
  console.log(`当前语录库有 ${quotes.length} 条语录`);
  
  if (quotes.length < 730) {
    console.error(`❌ 错误：语录数量不足！需要 730 条，当前只有 ${quotes.length} 条`);
    console.error(`请在 prisma/quotes-data.js 中添加更多语录`);
    process.exit(1);
  }

  // 清空现有数据
  await prisma.quote.deleteMany();
  console.log("✓ 已清空现有数据");

  // 生成两年的数据（730天）
  const startDate = new Date("2026-01-01");
  const quotesToInsert = [];

  for (let i = 0; i < 730; i++) {
    const displayDate = new Date(startDate);
    displayDate.setDate(startDate.getDate() + i);

    const quote = quotes[i];

    quotesToInsert.push({
      content: quote.content,
      author: quote.author,
      category: quote.category,
      displayDate,
    });
  }

  // 批量插入
  console.log("正在插入数据...");
  for (const quote of quotesToInsert) {
    await prisma.quote.create({
      data: quote,
    });
  }

  console.log(`✓ 成功生成 ${quotesToInsert.length} 条语录`);
  console.log(`  开始日期: 2026-01-01`);
  console.log(`  结束日期: 2027-12-31`);
  console.log(`  每条语录都是唯一的，不重复`);
}

main()
  .catch((e) => {
    console.error("❌ 种子数据生成失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
