const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    select: { id: true, email: true, modelable_type: true, modelable_id: true }
  });
  console.log('Users:', JSON.stringify(users, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
