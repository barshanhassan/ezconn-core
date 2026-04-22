
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workspaceId = BigInt(1);
  const totalContacts = await prisma.contacts.count({
    where: { workspace_id: workspaceId }
  });
  console.log(`Total contacts for workspace 1: ${totalContacts}`);
  
  const notDeletedContacts = await prisma.contacts.count({
    where: { workspace_id: workspaceId, deleted_at: null }
  });
  console.log(`Not deleted contacts for workspace 1: ${notDeletedContacts}`);

  if (notDeletedContacts > 0) {
    const sample = await prisma.contacts.findFirst({
      where: { workspace_id: workspaceId, deleted_at: null }
    });
    console.log('Sample contact:', JSON.stringify(sample, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
