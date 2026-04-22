
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.wa_templates.findMany({
    select: { status: true },
    distinct: ['status']
  });
  console.log('Distinct template statuses:', statuses.map(s => s.status));

  const workspace1Accounts = await prisma.wa_accounts.findMany({
    where: { workspace_id: BigInt(1) }
  });
  console.log('Workspace 1 Account IDs:', workspace1Accounts.map(a => a.id.toString()));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
