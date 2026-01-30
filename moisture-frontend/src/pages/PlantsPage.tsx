import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Plant, PlantListQuery } from '../lib/types'; // or from ../lib/types if you split types
import { listPlants, deletePlant as apiDeletePlant } from '../lib/ApiService';
import { PlantCreateModal } from '../components/PlantCreateModal';
import PlantCard from '../components/PlantCard';
import { useToast } from '../components/Toast';
import { parseURLSearchParams } from '../lib/PlantListQuery';

type ListResult = {
  total: number;
  offset: number;
  limit: number;
  items: Plant[];
};

const SORT_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'species', label: 'Species' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'moisture', label: 'Moisture' },
  { value: 'battery', label: 'Battery' },
] as const;

export default function PlantsPage() {
  const [params, setParams] = useSearchParams();
  const [createModal, setCreateModal] = useState<boolean>(false);
  const { show } = useToast();

  const offset = Number(params.get('offset') ?? 0);
  const limit = Number(params.get('limit') ?? 12);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value === '' || value == null) next.delete(key);
    else next.set(key, value);
    // reset offset when filters/sort change
    if (
      ['q', 'status', 'watering', 'species', 'sort', 'order', 'limit'].includes(
        key
      )
    ) {
      next.set('offset', '0');
    }
    setParams(next, { replace: true });
  }

  const [data, setData] = useState<ListResult>({
    total: 0,
    offset: 0,
    limit,
    items: [],
  });

  const [loading, setLoading] = useState(true);

  const query: PlantListQuery = useMemo(
    () => parseURLSearchParams(params),
    [params]
  );

  const uiFilters = {
    q: query.q ?? '',
    species: query.species ?? '',
    status: query.status ?? '',
    watering:
      query.watering === undefined ? '' : query.watering ? 'true' : 'false',
    sort: query.sort,
    order: query.order,
    limit: String(query.limit),
  };

  const loadPlants = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listPlants(query);
      setData(resp);
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : 'Failed to load plants', 'error');
    } finally {
      setLoading(false);
    }
  }, [query, show]);

  useEffect(() => {
    (async () => {
      await loadPlants();
    })();
  }, [loadPlants]);

  // Paginointi
  const canPrev = offset > 0;
  const canNext = offset + data.items.length < data.total;
  function goPrev() {
    if (!canPrev) return;
    updateParam('offset', String(Math.max(0, offset - limit)));
  }
  function goNext() {
    if (!canNext) return;
    updateParam('offset', String(offset + limit));
  }

  // Poisto & togglaus callbackit korteille
  async function handleDelete(id: number) {
    try {
      await apiDeletePlant(id);
    } catch {
      show('Error while deleting plant', 'error');
    } finally {
      show('Plant deleted', 'success');
      await loadPlants();
    }
  }

  const handlePlantCreated = async () => {
    setCreateModal(false);
    await loadPlants();
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="divider divider-vertical">Filters</div>

      {/* Suodatusrivi */}
      <div className="card bg-base-100 shadow mb-4 glass">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Search</legend>
              <input
                className="input input-bordered w-full"
                placeholder="(name, species, location...)"
                value={uiFilters.q}
                onChange={(e) => updateParam('q', e.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Status</legend>
              <select
                className="select select-bordered w-full"
                value={uiFilters.status}
                onChange={(e) => updateParam('status', e.target.value)}
              >
                <option value="">All</option>
                <option value="ok">ok</option>
                <option value="fault">fault</option>
                <option value="offline">offline</option>
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Watering</legend>
              <select
                className="select select-bordered w-full"
                value={uiFilters.watering}
                onChange={(e) => updateParam('watering', e.target.value)}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Species</legend>
              <input
                className="input input-bordered w-full"
                placeholder="e.g. ficus (specific)"
                value={uiFilters.species}
                onChange={(e) => updateParam('species', e.target.value)}
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Sort</legend>
              <select
                className="select select-bordered w-full"
                value={uiFilters.sort}
                onChange={(e) => updateParam('sort', e.target.value)}
              >
                {SORT_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Order</legend>
              <select
                className="select select-bordered w-full"
                value={uiFilters.order}
                onChange={(e) => updateParam('order', e.target.value)}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </fieldset>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="divider divider-vertical">Plants</div>

      {/* Lataus  */}
      {loading && (
        <div className="flex justify-center">
          <span className="loading loading-xl loading-spinner text-info"></span>
        </div>
      )}

      {/* Lista */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.items.map((p) => (
          <PlantCard key={p.id} plant={p} onDeleted={handleDelete} />
        ))}
      </div>

      {/* Tyhjä tila */}
      {!loading && data.items.length === 0 && (
        <div className="alert alert-info mt-4">
          No results with current filters
        </div>
      )}

      <div className="divider"></div>
      <div className="flex flex-wrap items-center gap-2 justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70"></span>
          <select
            className="select select-bordered select-sm"
            value={String(limit)}
            onChange={(e) => updateParam('limit', e.target.value)}
          >
            {[6, 12, 24, 48].map((n) => (
              <option key={n} value={n}>
                {n} / sivu
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm" disabled={!canPrev} onClick={goPrev}>
            « Edellinen
          </button>
          <button className="btn btn-sm" disabled={!canNext} onClick={goNext}>
            Seuraava »
          </button>
        </div>
        <div className="flex justify-end">
          <button
            className="btn btn-primary btn-md"
            onClick={() => setCreateModal(true)}
          >
            Create new
          </button>
        </div>
      </div>
      <PlantCreateModal
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onConfirm={handlePlantCreated}
      />
    </div>
  );
}
