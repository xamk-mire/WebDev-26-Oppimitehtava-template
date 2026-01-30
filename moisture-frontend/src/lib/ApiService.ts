// import * as mock from './api.mock';
import { parsePlantListQuery } from './PlantListQuery';
import type {
  AddPlantBody,
  AuthResponse,
  Device,
  ListResponse,
  Plant,
  PlantListQuery,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8001/api';
let TOKEN: string | null = null;

export function setApiToken(t: string | null) {
  TOKEN = t;
}

function buildHeaders(extra?: Record<string, string>): Headers {
  const h = new Headers({ 'Content-Type': 'application/json' });
  if (TOKEN) h.set('Authorization', `Bearer ${TOKEN}`);
  if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return h;
}

export const API = {
  listPlants: listPlants,
  getPlant: getPlant,
  togglePlantWatering: togglePlantWatering,
  addPlant: addPlant,
  deletePlant: deletePlant,
  login: login,
  register: register,
};

export async function listPlants(query: PlantListQuery): Promise<ListResponse> {
  const qs = parsePlantListQuery(query);
  const res = await fetch(`${API_BASE}/plants${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error(`GET /plants -> ${res.status}`);
  return res.json();
}

export async function getPlant(id: number): Promise<Plant> {
  const res = await fetch(`${API_BASE}/plants/${id}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error(`GET /plants/${id} -> ${res.status}`);
  return res.json();
}

export async function addPlant(input: AddPlantBody): Promise<Plant> {
  const res = await fetch(`${API_BASE}/plants`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`POST /plants -> ${res.status}`);
  return res.json();
}

export async function togglePlantWatering(id: number): Promise<Plant> {
  const res = await fetch(`${API_BASE}/plants/${id}/water`, {
    method: 'POST',
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error(`POST /plants/${id}/water -> ${res.status}`);
  return res.json();
}

export async function deletePlant(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/plants/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE /plants/${id} -> ${res.status}`);
}

export async function createOrReplaceDevice(
  plantId: number,
  payload: Partial<Pick<Device, 'status' | 'battery' | 'watering' | 'moisture'>>
): Promise<Plant> {
  const res = await fetch(`${API_BASE}/plants/${plantId}/device`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload ?? {}),
  });
  if (!res.ok)
    throw new Error(`POST /plants/${plantId}/device -> ${res.status}`);
  return res.json();
}

export async function deleteDevice(plantId: number): Promise<Plant | void> {
  const res = await fetch(`${API_BASE}/plants/${plantId}/device`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  if (!res.ok)
    throw new Error(`DELETE /plants/${plantId}/device -> ${res.status}`);
  return res.status === 204 ? undefined : res.json();
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(`Login failed: ${msg}`);
  }

  const data = (await res.json()) as AuthResponse;
  setApiToken(data.token);
  return data;
}
export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(`Register failed: ${msg}`);
  }

  const data = (await res.json()) as AuthResponse;
  setApiToken(data.token);
  return data;
}

async function safeErrorMessage(res: Response): Promise<string> {
  try {
    const json = await res.json();
    if (json?.error) return json.error;
    return `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
