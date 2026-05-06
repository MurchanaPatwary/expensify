import React, { useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import HeroBanner from '../components/HeroBanner.jsx';
import Snackbar from '../components/Snackbar.jsx';
import StatCard from '../components/StatCard.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import TripCard from '../components/TripCard.jsx';
import TripForm from '../components/TripForm.jsx';
import { useTrips } from '../hooks/useTrips.js';
import { createTripForm } from '../utils/tripHelpers.js';

function HomePage() {
  const { trips, isLoading, error, createTrip, deleteTrip, clearAllTrips } = useTrips();
  const [tripForm, setTripForm] = useState(createTripForm);
  const [tripError, setTripError] = useState('');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isClearingTrips, setIsClearingTrips] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  const updateTripForm = (field, value) => {
    setTripForm((current) => ({ ...current, [field]: value }));
    setTripError('');
  };

  const handleCreateTrip = async (event) => {
    event.preventDefault();

    if (
      !tripForm.place.trim() ||
      !tripForm.startDate ||
      !tripForm.endDate ||
      !tripForm.budget
    ) {
      setTripError('Place name, date range, and budget are required.');
      return;
    }

    if (new Date(tripForm.endDate) < new Date(tripForm.startDate)) {
      setTripError('End date cannot be before the start date.');
      return;
    }

    try {
      setIsCreatingTrip(true);
      const newTrip = await createTrip(tripForm);
      setTripForm(createTripForm());
      setSnackbar({ message: `${newTrip.place} trip added successfully.` });
    } catch (serverError) {
      setTripError(serverError.message);
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    setConfirmAction({ type: 'deleteTrip', tripId });
  };

  const deleteSelectedTrip = async (tripId) => {
    const tripToDelete = trips.find((trip) => trip.id === tripId);
    try {
      setDeletingTripId(tripId);
      await deleteTrip(tripId);
      setSnackbar({ message: `${tripToDelete?.place || 'Trip'} deleted successfully.` });
    } catch (serverError) {
      setTripError(serverError.message);
    } finally {
      setDeletingTripId('');
    }
  };

  const handleClearAllTrips = async () => {
    setConfirmAction({ type: 'clearTrips' });
  };

  const clearConfirmedTrips = async () => {
    try {
      setIsClearingTrips(true);
      await clearAllTrips();
      setSnackbar({ message: 'All trips deleted successfully.' });
    } catch (serverError) {
      setTripError(serverError.message);
    } finally {
      setIsClearingTrips(false);
    }
  };

  const confirmDialogContent =
    confirmAction?.type === 'deleteTrip'
      ? {
          title: 'Delete trip?',
          message: `This will remove ${
            trips.find((trip) => trip.id === confirmAction.tripId)?.place || 'this trip'
          } and its expenses.`,
          confirmLabel: 'Delete Trip',
        }
      : {
          title: 'Delete all trips?',
          message: 'This will remove every trip and expense entry from the list.',
          confirmLabel: 'Delete All',
        };

  const handleConfirmAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action?.type === 'deleteTrip') {
      await deleteSelectedTrip(action.tripId);
    }

    if (action?.type === 'clearTrips') {
      await clearConfirmedTrips();
    }
  };

  return (
    <div className="home-dashboard">
      <HeroBanner
        eyebrow="Home Page"
        title="Expensify Trips"
        description="Create a new trip here. Each trip appears in the list, and clicking a place opens its dedicated expense page."
        className="home-hero"
      >
        <StatCard label="Total Trips" value={trips.length} highlight />
        <StatCard
          label="Saved Places"
          value={trips.map((trip) => trip.place).join(', ') || 'No trips yet'}
        />
      </HeroBanner>

      <section className="home-main-grid">
        <div className="home-left-column">
          <TripForm
            form={tripForm}
            onChange={updateTripForm}
            onSubmit={handleCreateTrip}
            onClear={handleClearAllTrips}
            error={tripError || error}
            isSubmitting={isCreatingTrip}
            isClearing={isClearingTrips}
          />

          <div className="summary-stack compact-summary-stack">
            <SummaryCard
              icon={<MapPin size={18} />}
              label="Trip List Flow"
              value="Home to detail page"
              description="Create trip here, then open that place and manage only its expenses."
            />
            <SummaryCard
              icon={<CalendarDays size={18} />}
              label="Trip Dates"
              value="From and To"
              description="Each listed trip shows its date range and budget summary."
            />
          </div>
        </div>

        <section className="panel ledger-panel trip-list-panel">
          <div className="section-heading compact-heading">
            <div className="icon-wrap">
              <MapPin size={18} />
            </div>
            <div>
              <h2>Trip List</h2>
              <p>Click a place name to open that trip's expense page.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="empty-state compact-empty-state">
              <p>Loading trips from MongoDB...</p>
            </div>
          ) : trips.length || isCreatingTrip ? (
            <div className="trip-list compact-trip-list">
              {isCreatingTrip ? (
                <article className="trip-item pending-item" aria-live="polite">
                  <div className="trip-open">
                    <div className="trip-title-row">
                      <div className="trip-title-stack">
                        <h3>
                          <span className="skeleton-line skeleton-title" />
                        </h3>
                        <p className="trip-caption">
                          <span className="skeleton-line skeleton-caption" />
                        </p>
                      </div>
                      <span className="list-loader" aria-hidden="true" />
                    </div>
                  </div>
                </article>
              ) : null}
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={handleDeleteTrip}
                  isDeleting={deletingTripId === trip.id}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty-state">
              <p>No trips have been created yet. Add your first trip using the form.</p>
            </div>
          )}
        </section>
      </section>
      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={confirmDialogContent.title}
        message={confirmDialogContent.message}
        confirmLabel={confirmDialogContent.confirmLabel}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
      <Snackbar snackbar={snackbar} onClose={() => setSnackbar(null)} />
    </div>
  );
}

export default HomePage;
