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
