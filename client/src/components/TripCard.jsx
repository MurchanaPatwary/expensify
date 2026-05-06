import React from 'react';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, getTripRemaining } from '../utils/tripHelpers.js';

function TripCard({ trip, onDelete, isDeleting = false }) {
  const remainingBudget = getTripRemaining(trip);

  return (
    <article className="trip-item">
      <Link className="trip-open" to={`/trips/${trip.id}`}>
        <div className="trip-title-row">
          <div className="trip-title-stack">
            <h3>{trip.place}</h3>
            <p className="trip-caption">Open trip and manage its expense history</p>
          </div>
          <span className="trip-badge">
            {trip.expenses.length} expenses
            <ArrowUpRight size={14} />
          </span>
        </div>
        <div className="expense-meta">
          <span className="meta-date">{formatDate(trip.startDate)}</span>
          <span className="meta-date">{formatDate(trip.endDate)}</span>
          <span className="meta-budget">Budget {formatCurrency(trip.budget)}</span>
          <span className={remainingBudget >= 0 ? 'meta-positive' : 'meta-negative'}>
            Left {formatCurrency(remainingBudget)}
          </span>
        </div>
      </Link>

      <button
        type="button"
        className="icon-button"
        onClick={() => onDelete(trip.id)}
        disabled={isDeleting}
        aria-label={`Delete ${trip.place}`}
      >
        {isDeleting ? <span className="button-loader danger-loader" aria-hidden="true" /> : <Trash2 size={16} />}
      </button>
    </article>
  );
}

export default TripCard;
