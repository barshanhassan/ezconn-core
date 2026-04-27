const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Test1234!', 10);

  // 1. Update Agency User email to talha1234@gmail.com
  await prisma.users.update({
    where: { id: 64 },
    data: { email: 'talha1234@gmail.com' }
  });
  console.log('Agency User updated: talha1234@gmail.com');

  // 2. Create Workspace User
  const workspaceUser = await prisma.users.create({
    data: {
      email: 'workspace@ezconn.com',
      password: hashedPassword,
      first_name: 'Workspace',
      last_name: 'User',
      modelable_type: 'App\\Models\\Workspace',
      modelable_id: 20,
      email_verified_at: new Date(),
      creator_id: 64, // Setting a creator ID
    }
  });
  console.log('Workspace User created: workspace@ezconn.com (ID: ' + workspaceUser.id + ')');
}

main().catch(console.error).finally(() => prisma.$disconnect());
