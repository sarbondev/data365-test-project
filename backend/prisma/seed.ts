import { PrismaClient, Type } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: Type;
  color: string;
  icon: string;
}> = [
  // INCOME
  { name: 'Savdo', type: 'INCOME', color: '#10B981', icon: '💼' },
  { name: 'Xizmat', type: 'INCOME', color: '#3B82F6', icon: '🛠️' },
  { name: 'Investitsiya', type: 'INCOME', color: '#8B5CF6', icon: '📈' },
  { name: 'Boshqa', type: 'INCOME', color: '#64748B', icon: '📦' },
  // EXPENSE
  { name: 'Ijara', type: 'EXPENSE', color: '#F59E0B', icon: '🏢' },
  { name: 'Logistika', type: 'EXPENSE', color: '#EF4444', icon: '🚚' },
  { name: 'Maosh', type: 'EXPENSE', color: '#EC4899', icon: '👥' },
  { name: 'Marketing', type: 'EXPENSE', color: '#06B6D4', icon: '📣' },
  { name: 'Kommunal', type: 'EXPENSE', color: '#84CC16', icon: '💡' },
  { name: 'Boshqa', type: 'EXPENSE', color: '#64748B', icon: '📦' },
];

async function main() {
  console.log('🌱 Seeding default categories...');

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_type: { name: cat.name, type: cat.type } },
      update: {},
      create: { ...cat, isDefault: true },
    });
  }

  console.log(`✅ Seeded ${DEFAULT_CATEGORIES.length} default categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
