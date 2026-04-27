const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const workspaces = await prisma.workspaces.findMany({
    select: { id: true, name: true, agency_id: true }
  });
  console.log('Workspaces:', JSON.stringify(workspaces, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
