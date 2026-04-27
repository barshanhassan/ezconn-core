const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const email = 'talha1234@example.com';
  const newPass = 'Test1234!';
  const hashedPassword = await bcrypt.hash(newPass, 10);

  await prisma.users.updateMany({
    where: { email: email },
    data: { password: hashedPassword }
  });

  console.log(`Password for ${email} reset to "${newPass}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
