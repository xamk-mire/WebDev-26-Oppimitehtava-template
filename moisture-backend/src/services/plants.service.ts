import { AddPlantBody, Device, Plant } from '../models/types';
import {
  repoCreatePlant,
  repoDeletePlant,
  repoGetPlant,
  repoListPlants,
  repoToggleWatering,
} from '../repositories/plants.repo';

function mapRow(row: any): Plant {
  const device: Device = {
    id: row.device.id,
    status: row.device.status,
    battery: row.device.battery,
    watering: row.device.watering,
    moisture: row.device.moisture,
    created_at: row.device.createdAt.toISOString(),
    updated_at: row.device.updatedAt.toISOString(),
  };
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    location: row.location ?? null,
    notes: row.notes ?? null,
    device,
  };
}

export async function listPlants(params: any) {
  const { total, offset, limit, items } = await repoListPlants(params);
  return { total, offset, limit, items: items.map(mapRow) };
}

export async function getPlant(id: number): Promise<Plant | undefined> {
  const row = await repoGetPlant(id);
  return row ? mapRow(row) : undefined;
}

export async function toggleWateringService(
  id: number
): Promise<Plant | undefined> {
  const row = await repoToggleWatering(id);
  return row ? mapRow(row) : undefined;
}

export async function createPlantService(input: AddPlantBody): Promise<Plant> {
  const row = await repoCreatePlant(input);
  return mapRow(row);
}

export const deletePlantService = async (id: number) =>
  await repoDeletePlant(id);
