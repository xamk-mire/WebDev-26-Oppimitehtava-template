import { useState } from 'react';
import { API } from '../lib/ApiService';
import type { AddPlantBody } from '../lib/types';
import { useToast } from './Toast';

type PlantCreateModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PlantCreateModal({
  open,
  onCancel,
  onConfirm,
}: PlantCreateModalProps) {
  const { show } = useToast();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [battery, setBattery] = useState<number | ''>('');
  const [moisture, setMoisture] = useState<number | ''>('');
  const [status, setStatus] = useState<'ok' | 'fault' | 'offline'>('ok');
  const [watering, setWatering] = useState(false);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const device = advanced
        ? {
            status,
            battery: battery === '' ? undefined : Number(battery),
            moisture: moisture === '' ? undefined : Number(moisture),
            watering,
          }
        : undefined;

      await API.addPlant({
        name,
        species,
        location: location || null,
        notes: notes || null,
        device,
      } as AddPlantBody);

      clearForm();
      onConfirm();

      show('Plant added', 'success');
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : 'Failed to create new plant', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const handleBackdropClick = () => {
    handleCancel();
  };

  const handleCancel = () => {
    clearForm();
    onCancel();
  };

  const clearForm = () => {
    // Clear form
    setName('');
    setSpecies('');
    setLocation('');
    setNotes('');
    setBattery('');
    setMoisture('');
    setWatering(false);
    setStatus('ok');
  };

  const stopPropagation = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div className="modal modal-open" onClick={handleBackdropClick}>
      <div className="modal-box" onClick={stopPropagation}>
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Add plant</h2>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="label">
                  <span className="label-text">Name *</span>
                </label>
                <input
                  className="input input-bordered w-full"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Species *</span>
                </label>
                <input
                  className="input input-bordered w-full"
                  required
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    <span className="label-text">Location</span>
                  </label>
                  <input
                    className="input input-bordered w-full"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Notes</span>
                  </label>
                  <input
                    className="input input-bordered w-full"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="collapse bg-base-200">
                <input
                  type="checkbox"
                  checked={advanced}
                  onChange={(e) => setAdvanced(e.target.checked)}
                />
                <div className="collapse-title font-medium">
                  Device defaults (optional)
                </div>
                <div className="collapse-content grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">
                      <span className="label-text">Status</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'ok' | 'fault' | 'offline')}
                    >
                      <option value="ok">ok</option>
                      <option value="fault">fault</option>
                      <option value="offline">offline</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Battery (0–100)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input input-bordered w-full"
                      value={battery}
                      onChange={(e) =>
                        setBattery(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Moisture (0–100)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input input-bordered w-full"
                      value={moisture}
                      onChange={(e) =>
                        setMoisture(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <label className="label cursor-pointer">
                    <span className="label-text">Watering ON</span>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={watering}
                      onChange={(e) => setWatering(e.target.checked)}
                    />
                  </label>
                </div>
              </div>

              <div className="card-actions justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCancel}
                >
                  Cancel asd
                </button>
                <button
                  className={`btn btn-primary ${submitting ? 'loading' : ''}`}
                  disabled={submitting}
                >
                  Add plant
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
