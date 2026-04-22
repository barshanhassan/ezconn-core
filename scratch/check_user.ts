import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findFirst({
    where: { full_name: { contains: 'Bilal Aslam' } },
    select: {
      id: true,
      full_name: true,
      active_workspace_id: true,
    }
  });
  console.log('User Bilal Aslam:', JSON.stringify(user, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
