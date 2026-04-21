import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'bilal.aslam@connectagroupcorp.com';
  const newPassword = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update in users table
  try {
    const updatedUser = await (prisma as any).users.update({
      where: { email: email },
      data: { password: hashedPassword },
    });
    console.log(`Password updated for User: ${email}`);
  } catch (e) {
    console.log(`User ${email} not found in 'users' table or update failed.`);
  }

  // Update in administrators table
  try {
    const updatedAdmin = await prisma.administrators.updateMany({
      where: { email: email },
      data: { password: hashedPassword },
    });
    if (updatedAdmin.count > 0) {
        console.log(`Password updated for Admin: ${email}`);
    }
  } catch (e) {}
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
