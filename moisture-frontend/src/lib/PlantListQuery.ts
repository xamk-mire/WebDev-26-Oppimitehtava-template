import type { PlantListQuery, DeviceStatus, PlantListSortField } from './types';

// Helper method
export function parseURLSearchParams(params: URLSearchParams): PlantListQuery {
  const q = params.get('q') ?? undefined;
  const statusParam = params.get('status') ?? '';
  const wateringParam = params.get('watering') ?? '';
  const species = params.get('species') ?? undefined;
  const sortParam = (params.get('sort') ?? 'name') as PlantListSortField;
  const orderParam = (params.get('order') ?? 'asc') as 'asc' | 'desc';
  const offsetParam = Number(params.get('offset') ?? 0);
  const limitParam = Number(params.get('limit') ?? 12);

  const status: DeviceStatus | undefined =
    statusParam === '' ? undefined : (statusParam as DeviceStatus);

  const watering =
    wateringParam === '' ? undefined : wateringParam === 'true' ? true : false;

  return {
    q,
    status,
    watering,
    species,
    sort: sortParam,
    order: orderParam,
    offset: offsetParam,
    limit: limitParam,
  };
}

// Helper method
export function parsePlantListQuery(query: PlantListQuery): string {
  const rawParams: Record<string, string | undefined> = {
    q: query.q,
    status: query.status,
    species: query.species,
    // booleans must be converted to "true"/"false" strings
    watering: query.watering === undefined ? undefined : String(query.watering),
    sort: query.sort,
    order: query.order,
    offset: String(query.offset),
    limit: String(query.limit),
  };

  return new URLSearchParams(
    Object.entries(rawParams).filter(
      ([, v]) => v !== undefined && v !== ''
    ) as [string, string][]
  ).toString();
}
