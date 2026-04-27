const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agencyId = 7n;
  await prisma.agencies.update({
    where: { id: agencyId },
    data: { onboarding_status: 'ACTIVE' }
  });
  console.log(`Agency ${agencyId} onboarding status set to ACTIVE.`);

}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
