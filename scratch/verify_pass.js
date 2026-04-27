const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const email = 'talha1234@example.com';
  const user = await prisma.users.findFirst({
    where: { email: email }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User ID:', user.id.toString());
  console.log('User Status:', user.status);
  console.log('Hash in DB:', user.password);


  const testPass = 'Test1234!';
  const isValid = await bcrypt.compare(testPass, user.password);
  console.log(`Password "${testPass}" valid?`, isValid);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
