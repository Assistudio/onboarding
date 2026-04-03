import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const roles = {
  admin: 'ADMIN',
  agent: 'AGENT',
} as const;

const policyCategories = {
  auto: 'AUTO',
  casa: 'CASA',
  vita: 'VITA',
  salute: 'SALUTE',
} as const;

const policyStatuses = {
  active: 'ACTIVE',
  expiring: 'EXPIRING',
} as const;

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assistudiovigevano.it' },
    update: {},
    create: {
      email: 'admin@assistudiovigevano.it',
      name: 'Admin Vigevano',
      role: roles.admin,
      passwordHash: adminHash,
    },
  });

  // Create agent users
  const agentHash = await bcrypt.hash('Agent1234!', 12);
  const agent1 = await prisma.user.upsert({
    where: { email: 'marco.rossi@assistudiovigevano.it' },
    update: {},
    create: {
      email: 'marco.rossi@assistudiovigevano.it',
      name: 'Marco Rossi',
      role: roles.agent,
      passwordHash: agentHash,
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: 'giulia.ferrari@assistudiovigevano.it' },
    update: {},
    create: {
      email: 'giulia.ferrari@assistudiovigevano.it',
      name: 'Giulia Ferrari',
      role: roles.agent,
      passwordHash: agentHash,
    },
  });

  // Create sample clients
  const client1 = await prisma.client.upsert({
    where: { codiceFiscale: 'BNCMRA80A01F205X' },
    update: {},
    create: {
      codiceFiscale: 'BNCMRA80A01F205X',
      firstName: 'Mario',
      lastName: 'Bianchi',
      email: 'mario.bianchi@gmail.com',
      phone: '+39 0342 123456',
      address: 'Via Roma 12, Vigevano PV',
      agents: {
        create: { agentId: agent1.id },
      },
    },
  });

  const client2 = await prisma.client.upsert({
    where: { codiceFiscale: 'VRDFNC75B02G888Y' },
    update: {},
    create: {
      codiceFiscale: 'VRDFNC75B02G888Y',
      firstName: 'Francesca',
      lastName: 'Verdi',
      email: 'francesca.verdi@libero.it',
      phone: '+39 0382 987654',
      address: 'Via Garibaldi 44, Pavia PV',
      agents: {
        create: [{ agentId: agent1.id }, { agentId: agent2.id }],
      },
    },
  });

  const client3 = await prisma.client.upsert({
    where: { codiceFiscale: 'MRNGNN90C03H501Z' },
    update: {},
    create: {
      codiceFiscale: 'MRNGNN90C03H501Z',
      firstName: 'Giovanni',
      lastName: 'Marini',
      email: 'giovanni.marini@hotmail.it',
      phone: '+39 0381 456789',
      address: 'Corso Cavour 8, Vigevano PV',
      agents: {
        create: { agentId: agent2.id },
      },
    },
  });

  // Create sample policies
  const today = new Date();
  const in25Days = new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000);
  const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  const in365Days = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

  await prisma.policy.upsert({
    where: { policyNumber: 'AXA-2024-001234' },
    update: {},
    create: {
      policyNumber: 'AXA-2024-001234',
      insuranceCompany: 'AXA Assicurazioni',
      category: policyCategories.auto,
      premiumCents: 89500,
      startDate: oneYearAgo,
      renewalDate: in25Days, // expiring soon!
      status: policyStatuses.expiring,
      clientId: client1.id,
    },
  });

  await prisma.policy.upsert({
    where: { policyNumber: 'GEN-2024-005678' },
    update: {},
    create: {
      policyNumber: 'GEN-2024-005678',
      insuranceCompany: 'Generali Italia',
      category: policyCategories.casa,
      premiumCents: 45000,
      startDate: oneYearAgo,
      renewalDate: in90Days,
      status: policyStatuses.active,
      clientId: client1.id,
    },
  });

  await prisma.policy.upsert({
    where: { policyNumber: 'UNI-2024-009012' },
    update: {},
    create: {
      policyNumber: 'UNI-2024-009012',
      insuranceCompany: 'UnipolSai',
      category: policyCategories.vita,
      premiumCents: 120000,
      startDate: oneYearAgo,
      renewalDate: in365Days,
      status: policyStatuses.active,
      clientId: client2.id,
    },
  });

  await prisma.policy.upsert({
    where: { policyNumber: 'ALZ-2024-003456' },
    update: {},
    create: {
      policyNumber: 'ALZ-2024-003456',
      insuranceCompany: 'Allianz',
      category: policyCategories.salute,
      premiumCents: 67800,
      startDate: oneYearAgo,
      renewalDate: in25Days, // expiring soon!
      status: policyStatuses.expiring,
      clientId: client2.id,
    },
  });

  await prisma.policy.upsert({
    where: { policyNumber: 'INT-2024-007890' },
    update: {},
    create: {
      policyNumber: 'INT-2024-007890',
      insuranceCompany: 'Intesa Vita',
      category: policyCategories.auto,
      premiumCents: 75000,
      startDate: oneYearAgo,
      renewalDate: in90Days,
      status: policyStatuses.active,
      clientId: client3.id,
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin:  admin@assistudiovigevano.it / Admin1234!');
  console.log('  Agent:  marco.rossi@assistudiovigevano.it / Agent1234!');
  console.log('  Agent:  giulia.ferrari@assistudiovigevano.it / Agent1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
