import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const first = await prisma.inbox.findFirst();
  console.log('First inbox record:', JSON.stringify(first, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
