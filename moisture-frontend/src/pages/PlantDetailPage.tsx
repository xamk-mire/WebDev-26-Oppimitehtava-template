// frontend/src/pages/PlantDetailPage.tsx (sketch)
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../lib/ApiService';
import type { Plant } from '../lib/types';
import { useToast } from '../components/Toast';

export default function PlantDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { show } = useToast();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (id) setPlant(await API.getPlant(+id));
      } catch (e: unknown) {
        show(e instanceof Error ? e.message : 'Failed to get plant', 'error');
      } finally {
        setLoading(false);
      }
    })();
  });

  if (loading) return <div className="p-4">Loading...</div>;
  if (!plant)
    return <div className="alert alert-error m-4">Plant not found</div>;

  return (
    <div className="mx-auto max-w-3xl p-4 ">
      <div className="card glass shadow">
        <div className="card-body">
          <h2 className="card-title">{plant.name}</h2>
          <p className="opacity-70">
            {plant.species}
            {plant.location ? ` • ${plant.location}` : ''}
          </p>

          <div className="divider">Device</div>
          {plant.device ? (
            <div className="grid grid-cols-3 gap-2 text-sm mt-2">
              <div className="badge badge-outline">
                Moist {plant.device?.moisture ?? '-'}
              </div>
              <div className="badge badge-outline">
                Batt {plant.device?.battery ?? '-'}
              </div>
              <div
                className={`badge ${
                  plant.device?.watering ? 'badge-primary' : 'badge-neutral'
                }`}
              >
                Watering: {plant.device?.watering ? 'Watering' : 'Idle'}
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              <span>No device.</span>
            </div>
          )}

          <div className="card-actions justify-between">
            <button className="btn" onClick={() => nav(-1)}>
              Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
