import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.administrators.findMany({
    take: 5,
    select: { email: true, name: true }
  });
  console.log('Admins:', admins);

  try {
     const users = await (prisma as any).users.findMany({
        take: 5,
        select: { email: true, name: true }
     });
     console.log('Users:', users);
  } catch (e) {}
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
