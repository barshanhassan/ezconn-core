const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123', 10);
  const email = 'bilal.aslam@connectagroupcorp.com';
  
  let user = await prisma.users.findFirst({
    where: { email: email }
  });

  if (user) {
    user = await prisma.users.update({
      where: { id: user.id },
      data: { password: hash, status: 'ACTIVE' }
    });
    console.log('User updated:', user.email);
  } else {
    // If not exists, we need an agency for modelable
    let agency = await prisma.agencies.findFirst();
    if (!agency) {
       agency = await prisma.agencies.create({
         data: {
           name: "Connecta Group",
           slug: "connecta-group",
           email: email,
           timezone: "UTC",
           notification_language: "en-US",
           billing_company: "Connecta Group",
           billing_person: "Bilal Aslam",
           status: "ACTIVE"
         }
       });
    }

    user = await prisma.users.create({
      data: { 
        email: email, 
        password: hash, 
        first_name: 'Bilal', 
        last_name: 'Aslam', 
        status: 'ACTIVE', 
        is_owner: true, 
        modelable_type: 'App\\Models\\Agency', 
        modelable_id: agency.id, 
        creator_id: 0, 
        locale: 'en-US' 
      }
    });
    console.log('User created:', user.email);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
