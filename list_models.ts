import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));
  console.log('Available Models:', models);

  if (models.includes('users')) {
    const users = await (prisma as any).users.findMany({ take: 5, select: { email: true } });
    console.log('Users:', users);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
