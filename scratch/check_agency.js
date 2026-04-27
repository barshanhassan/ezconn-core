const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agencyId = 7n;
  const agency = await prisma.agencies.findUnique({
    where: { id: agencyId }
  });
  console.log(JSON.stringify(agency, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
