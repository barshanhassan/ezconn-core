import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await (prisma as any).inbox.findMany({
      include: {
        contacts: true,
      }
    });
    console.log('Result:', result.length);
  } catch (e) {
    console.error('Error in query:', e.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
