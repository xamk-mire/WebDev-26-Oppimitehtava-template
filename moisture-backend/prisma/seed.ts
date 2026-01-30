import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.device.deleteMany();
  await prisma.plant.deleteMany();

  const data = [
    {
      name: 'Monstera - Office',
      species: 'monstera',
      location: 'Office',
      notes: null,
      device: {
        create: { status: 'ok', battery: 92, watering: false, moisture: 47.5 },
      },
    },
    {
      name: 'Fiddle Leaf Fig',
      species: 'ficus',
      location: 'Living Room',
      notes: 'Rotate weekly',
      device: {
        create: { status: 'ok', battery: 87, watering: false, moisture: 39.2 },
      },
    },
    {
      name: 'Cactus',
      species: 'cactus',
      location: 'Kitchen',
      notes: null,
      device: {
        create: { status: 'ok', battery: 96, watering: false, moisture: 22.1 },
      },
    },
  ];

  for (const p of data) {
    await prisma.plant.create({ data: p as any });
  }
  console.log('Seed done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
