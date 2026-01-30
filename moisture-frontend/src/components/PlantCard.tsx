import { useState } from 'react';
import type { Plant } from '../lib/types';
import { useToast } from './Toast';
import { API } from '../lib/ApiService';
import { Link } from 'react-router-dom';

function StatusBadge(s?: string) {
  if (s === 'ok') return 'badge-success';
  if (s === 'fault') return 'badge-warning';
  return 'badge-neutral';
}

export default function PlantCard({
  plant,
  onDeleted,
}: {
  plant: Plant;
  onDeleted: (id: number) => void;
}) {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const handleWaterToggle = async () => {
    setBusy(true);
    try {
      const upd = await API.togglePlantWatering(plant.id);
      plant.device.watering = upd.device.watering;
      show(
        upd.device?.watering
          ? 'Watering is turned ON'
          : 'Watering is turned OFF',
        'success'
      );
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : 'Failed to change Watering status', 'error');
    } finally {
      setBusy(false);
    }
  };

  const deletePlant = async () => {
    setOpen(false);
    onDeleted(plant.id);
  };

  return (
    <>
      <div className="card bg-base-100 shadow h-full p-4 glass">
        <div className="card-body">
          <div className="flex items-start justify-between gap-2">
            <h3 className="card-title">{plant.name}</h3>
            <div
              className={`badge ${StatusBadge(
                plant.device?.status
              )} badge-neon`}
            >
              {plant.device?.status ?? 'no-device'}
            </div>
          </div>

          <p className="text-sm opacity-70">
            {plant.species}
            {plant.location ? ` • ${plant.location}` : ''}
          </p>

          <div className="flex gap-2 text-sm mt-2 items-center">
            <div className="badge badge-accent">
              Moist {plant.device?.moisture ?? '-'}
            </div>
            <div className="badge badge-primary badge-accent">
              Batt {plant.device?.battery ?? '-'}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <label className="flex items-center gap-1 cursor-pointer">
              <span className="text-xs">OFF</span>
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={!!plant.device?.watering}
                onChange={handleWaterToggle}
                disabled={busy || !plant.device}
              />
              <span className="text-xs">ON</span>
            </label>
            <div
              className={`badge ${
                plant.device?.watering ? 'badge-accent' : 'badge-neutral'
              }`}
            >
              {plant.device?.watering ? 'Watering' : 'Idle'}
            </div>
          </div>
        </div>

        <div className="card-actions flex justify-between">
          <Link to={`/plants/${plant.id}`} className="btn btn-primary btn-sm">
            Show
          </Link>

          <button
            onClick={() => setOpen(true)}
            className="btn btn-error btn-sm"
            disabled={busy}
          >
            Delete
          </button>
        </div>
      </div>

      <dialog
        className={`modal ${open ? 'modal-open' : ''}`}
        onClose={() => setOpen(false)}
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">Delete the plant?</h3>
          <p className="py-2">
            Action will also delete the device connected to the plant.
          </p>
          <div className="modal-action">
            <button className="btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className={`btn btn-error ${busy ? 'loading' : ''}`}
              onClick={() => deletePlant()}
              disabled={busy}
            >
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setOpen(false)}>close</button>
        </form>
      </dialog>
    </>
  );
}
