import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const inboxId = 8n;
  const inbox = await prisma.inbox.findUnique({
    where: { id: inboxId },
  });

  console.log('Inbox Record:', JSON.stringify(inbox, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));

  if (inbox && inbox.modelable_id) {
      if (inbox.modelable_type?.includes('Whatsapp')) {
          const chat = await prisma.wa_chats.findUnique({
              where: { id: inbox.modelable_id }
          });
          console.log('WA Chat Record:', JSON.stringify(chat, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          , 2));
      }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
