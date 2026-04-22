
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sampleTagLink = await prisma.tag_links.findFirst({
    where: { linkable_type: { contains: 'Contact' } }
  });
  console.log('Sample tag_link for contact:', JSON.stringify(sampleTagLink, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  const sampleTag = await prisma.tags.findFirst();
  console.log('Sample tag:', JSON.stringify(sampleTag, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
