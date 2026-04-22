import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.inbox.count();
  console.log('Total inbox records:', count);
  
  const firstFive = await prisma.inbox.findMany({
    take: 5,
    select: {
      id: true,
      workspace_id: true,
      status: true,
    }
  });
  console.log('Sample records:', JSON.stringify(firstFive, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
