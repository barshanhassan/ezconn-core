const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Setup Agency and its Owner
    let agency = await prisma.agencies.findFirst();
    if (!agency) {
      agency = await prisma.agencies.create({
        data: {
          name: 'Talha Agency',
          slug: 'talha-agency',
          email: 'talha@ezconn.com',
          status: 'ACTIVE',
        }
      });
      console.log('Created Agency:', agency.id);
    } else {
      console.log('Found existing Agency:', agency.id);
    }

    const talhaPassword = await bcrypt.hash('Agency@123', 10);
    
    let talhaUser = await prisma.users.findFirst({ where: { email: 'talha@ezconn.com' }});
    if (talhaUser) {
      talhaUser = await prisma.users.update({
        where: { id: talhaUser.id },
        data: { 
          password: talhaPassword,
          modelable_type: 'App\\Models\\Agency',
          modelable_id: agency.id,
          status: 'ACTIVE'
        }
      });
      console.log('Updated talha@ezconn.com');
    } else {
      talhaUser = await prisma.users.create({
        data: {
          first_name: 'Talha',
          last_name: 'Agency',
          email: 'talha@ezconn.com',
          password: talhaPassword,
          modelable_type: 'App\\Models\\Agency',
          modelable_id: agency.id,
          is_owner: true,
          status: 'ACTIVE',
          creator_id: 0n,
        }
      });
      console.log('Created talha@ezconn.com');
    }

    // 2. Setup Workspace and its User
    let workspace = await prisma.workspaces.findFirst();
    if (!workspace) {
      workspace = await prisma.workspaces.create({
        data: {
          name: 'Barshan Workspace',
          slug: 'barshan-workspace',
          agency_id: agency.id,
          creator_id: talhaUser.id,
          status: 'ACTIVE',
          contacts_counter: 0
        }
      });
      console.log('Created Workspace:', workspace.id);
    } else {
      console.log('Found existing Workspace:', workspace.id);
    }

    const barshanPassword = await bcrypt.hash('Workspace@123', 10);
    
    let barshanUser = await prisma.users.findFirst({ where: { email: 'barshan@ezconn.com' }});
    if (barshanUser) {
      barshanUser = await prisma.users.update({
        where: { id: barshanUser.id },
        data: {
          password: barshanPassword,
          modelable_type: 'App\\Models\\Workspace',
          modelable_id: workspace.id,
          status: 'ACTIVE'
        }
      });
      console.log('Updated barshan@ezconn.com');
    } else {
      barshanUser = await prisma.users.create({
        data: {
          first_name: 'Barshan',
          last_name: 'Workspace',
          email: 'barshan@ezconn.com',
          password: barshanPassword,
          modelable_type: 'App\\Models\\Workspace',
          modelable_id: workspace.id,
          is_owner: true,
          status: 'ACTIVE',
          creator_id: talhaUser.id,
        }
      });
      console.log('Created barshan@ezconn.com');
    }

    // 3. Setup Domains (Optional, just to ensure login routing works if domains are strict)
    // Add domain entries for localhost
    const existingAgencyDomain = await prisma.domains.findFirst({ where: { domain: 'agency.localhost:5173' }});
    if (!existingAgencyDomain) {
       await prisma.domains.create({
         data: {
           modelable_type: 'App\\Models\\Agency',
           modelable_id: agency.id,
           sub_domain: 'agency',
           root_domain: 'localhost:5173',
           domain: 'agency.localhost:5173',
           active: true,
           is_default: true,
         }
       });
       console.log('Added agency domain routing');
    }

    const existingWorkspaceDomain = await prisma.domains.findFirst({ where: { domain: 'localhost:5173' }});
    if (!existingWorkspaceDomain) {
       await prisma.domains.create({
         data: {
           modelable_type: 'App\\Models\\Workspace',
           modelable_id: workspace.id,
           sub_domain: 'www',
           root_domain: 'localhost:5173',
           domain: 'localhost:5173',
           active: true,
           is_default: true,
         }
       });
       console.log('Added workspace domain routing');
    }

    console.log('Seed completed successfully!');

  } catch (error) {
    console.error('Seed Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
