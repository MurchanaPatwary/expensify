import React from 'react';
import { MapPin } from 'lucide-react';

function TripForm({
  form,
  onChange,
  onSubmit,
  onClear,
  error,
  isSubmitting = false,
  isClearing = false,
}) {
  const isBusy = isSubmitting || isClearing;

  return (
    <form className="panel trip-panel" onSubmit={onSubmit}>
      <div className="section-heading">
        <div className="icon-wrap">
          <MapPin size={16} />
        </div>
        <div>
          <h2>Add New Trip</h2>
          <p>Add the place name, date range, and total budget.</p>
        </div>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Place Name</span>
          <input
            type="text"
            placeholder="Guwahati"
            value={form.place}
            onChange={(event) => onChange('place', event.target.value)}
          />
        </label>

        <label className="field">
          <span>Total Budget</span>
          <input
            type="number"
            min="0"
            placeholder="10000"
            value={form.budget}
            onChange={(event) => onChange('budget', event.target.value)}
          />
        </label>

        <label className="field">
          <span>From</span>
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => onChange('startDate', event.target.value)}
          />
        </label>

        <label className="field">
          <span>To</span>
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => onChange('endDate', event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="message">{error}</p> : null}

      <div className="button-row">
        <button type="submit" className="primary-button" disabled={isBusy}>
          {isSubmitting ? (
            <span className="button-loader" aria-label="Creating trip" />
          ) : (
            'Create Trip'
          )}
        </button>
        <button type="button" className="ghost-button" onClick={onClear} disabled={isBusy}>
          {isClearing ? (
            <span className="button-loader" aria-label="Clearing trips" />
          ) : (
            'Clear All Trips'
          )}
        </button>
      </div>
    </form>
  );
}

export default TripForm;
