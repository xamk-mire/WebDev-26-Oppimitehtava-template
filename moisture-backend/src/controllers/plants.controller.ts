import { Request, Response } from 'express';
import {
  listPlants,
  getPlant,
  deletePlantService,
  createPlantService,
  toggleWateringService,
} from '../services/plants.service';
import { AddPlantBody } from '../models/types';

export async function getAll(req: Request, res: Response) {
  const { q, status, watering, species, sort, order, offset, limit } =
    req.query as any;
  const parsed = {
    q,
    status:
      status && ['ok', 'fault', 'offline'].includes(status)
        ? status
        : undefined,
    watering: watering === undefined ? undefined : watering === 'true',
    species,
    sort:
      sort &&
      [
        'name',
        'species',
        'createdAt',
        'updatedAt',
        'moisture',
        'battery',
      ].includes(sort)
        ? sort
        : 'name',
    order: order === 'desc' ? 'desc' : 'asc',
    offset: Number.isFinite(Number(offset)) ? Number(offset) : 0,
    limit: Number.isFinite(Number(limit)) ? Number(limit) : 20,
  };
  if (parsed.limit > 100)
    return res.status(400).json({ error: 'limit max 100' });
  const data = await listPlants(parsed);
  res.json(data);
}

export async function getOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1)
    return res.status(400).json({ error: 'Invalid id' });

  const plant = await getPlant(id);
  if (!plant) return res.status(404).json({ error: 'Plant not found' });
  res.json(plant);
}

export async function toggleWater(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1)
    return res.status(400).json({ error: 'Invalid id' });

  const updated = await toggleWateringService(id);
  if (!updated) return res.status(404).json({ error: 'Plant not found' });
  res.json(updated);
}

export async function createPlant(req: Request, res: Response) {
  const body = req.body as AddPlantBody;
  try {
    const plant = await createPlantService(body);
    res.status(201).json(plant);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePlant(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1)
    return res.status(400).json({ error: 'Invalid id' });
  try {
    const ok = await deletePlantService(id);
    if (!ok) return res.status(404).json({ error: 'Plant not found' });
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
