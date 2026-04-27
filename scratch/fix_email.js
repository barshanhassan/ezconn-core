const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.users.update({
    where: { id: 64 },
    data: { email: 'talha1234@example.com' }
  });
  console.log('Agency User updated back to: talha1234@example.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
