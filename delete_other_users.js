const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.users.deleteMany({
      where: {
        NOT: [
          { email: 'talha@ezconn.com' },
          { email: 'barshan@ezconn.com' }
        ]
      }
    });
    console.log(`Successfully deleted ${result.count} users.`);
    console.log('Remaining users:', await prisma.users.findMany({ select: { email: true } }));
  } catch (error) {
    console.error('Error deleting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
