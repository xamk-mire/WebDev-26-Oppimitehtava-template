import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

type ListParams = {
  q?: string;
  status?: 'ok' | 'fault' | 'offline';
  watering?: boolean;
  species?: string;
  sort?:
    | 'name'
    | 'species'
    | 'createdAt'
    | 'updatedAt'
    | 'moisture'
    | 'battery';
  order?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
};

export async function repoListPlants(params: ListParams) {
  const {
    q,
    status,
    watering,
    species,
    sort = 'name',
    order = 'asc',
    offset = 0,
    limit = 20,
  } = params;

  const where: Prisma.PlantWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { species: { contains: q, mode: 'insensitive' } },
              { location: { contains: q, mode: 'insensitive' } },
              { notes: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      species ? { species } : {},
      status ? { device: { status } } : {},
      watering !== undefined ? { device: { watering } } : {},
    ],
  };

  // orderBy for device fields
  const orderBy: any =
    sort === 'moisture'
      ? { device: { moisture: order } }
      : sort === 'battery'
      ? { device: { battery: order } }
      : { [sort]: order };

  const [total, items] = await Promise.all([
    prisma.plant.count({ where }),
    prisma.plant.findMany({
      where,
      orderBy,
      skip: offset,
      take: Math.min(limit, 100),
      include: { device: true },
    }),
  ]);
  return { total, offset, limit: Math.min(limit, 100), items };
}

export async function repoGetPlant(id: number) {
  return prisma.plant.findUnique({
    where: { id },
    include: { device: true },
  });
}

export async function repoToggleWatering(id: number) {
  const plant = await prisma.plant.findUnique({
    where: { id },
    include: { device: true },
  });
  if (!plant || !plant.device) return null;
  const updated = await prisma.device.update({
    where: { id: plant.device.id },
    data: { watering: !plant.device.watering },
    include: { plant: true },
  });
  return { ...updated.plant!, device: updated };
}

export async function repoCreatePlant(input: {
  name: string;
  species: string;
  location?: string | null;
  notes?: string | null;
  device?: Partial<{
    status: 'ok' | 'fault' | 'offline';
    battery: number;
    watering: boolean;
    moisture: number;
  }>;
}) {
  const d = input.device ?? {};
  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

  return prisma.plant.create({
    data: {
      name: input.name,
      species: input.species,
      location: input.location ?? null,
      notes: input.notes ?? null,
      device: {
        create: {
          status: (d.status as any) ?? 'ok',
          battery: clamp(d.battery ?? 100, 0, 100),
          watering: d.watering ?? false,
          moisture: clamp(d.moisture ?? 50, 0, 100),
        },
      },
    },
    include: { device: true },
  });
}

export async function repoDeletePlant(id: number): Promise<boolean> {
  try {
    await prisma.plant.delete({ where: { id } }); // Device row is removed by FK cascade
    return true;
  } catch (e: any) {
    // Prisma throws when record doesn't exist
    if (e.code === 'P2025') return false; // Record to delete does not exist
    throw e;
  }
}
