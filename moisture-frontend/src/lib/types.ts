export type DeviceStatus = 'ok' | 'fault' | 'offline';

export type Device = {
  id: number; // numeric id
  status: DeviceStatus;
  battery: number; // %
  watering: boolean;
  moisture: number; // %
  created_at: string;
  updated_at: string;
};

export type Plant = {
  id: number; // numeric id
  name: string;
  species: string;
  location?: string | null;
  notes?: string | null;
  device: Device; // one device linked to the plant
};

export type AddPlantBody = {
  name: string;
  species: string;
  location?: string | null;
  notes?: string | null;
  device?: Device;
};

export type ListResponse = {
  total: number;
  offset: number;
  limit: number;
  items: Plant[];
};

export type AuthUser = {
  id: number;
  email: string;
  name?: string | null;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type PlantListSortField =
  | 'name'
  | 'species'
  | 'createdAt'
  | 'updatedAt'
  | 'moisture'
  | 'battery';

export type PlantListQuery = {
  q?: string;
  status?: DeviceStatus;
  watering?: boolean;
  species?: string;
  sort: PlantListSortField;
  order: 'asc' | 'desc';
  offset: number;
  limit: number;
};
