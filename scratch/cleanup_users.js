const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const keepEmail = "talha1234@example.com";
  
  // Find the user to keep
  const keepUser = await prisma.users.findFirst({
    where: { email: keepEmail }
  });


  if (!keepUser) {
    console.error(`User ${keepEmail} not found!`);
    return;
  }

  console.log(`Keeping user: ${keepUser.email} (ID: ${keepUser.id})`);

  // Delete all other users
  const deleteResult = await prisma.users.deleteMany({
    where: {
      id: {
        not: keepUser.id
      }
    }
  });

  console.log(`Deleted ${deleteResult.count} other users.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
