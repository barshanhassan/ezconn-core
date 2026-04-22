import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findUnique({
    where: { id: BigInt(3) }
  });
  console.log('User ID 3:', JSON.stringify(user, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
