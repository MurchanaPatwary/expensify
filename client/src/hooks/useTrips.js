import { useEffect, useMemo, useState } from 'react';
import {
  addExpenseRequest,
  clearTripsRequest,
  createTripRequest,
  deleteExpenseRequest,
  deleteTripRequest,
  fetchTrips,
} from '../data/tripApi.js';

export function useTrips() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadTrips() {
      try {
        const serverTrips = await fetchTrips();

        if (isMounted) {
          setTrips(serverTrips);
          setError('');
        }
      } catch (serverError) {
        if (isMounted) {
          setError(serverError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, []);

  const actions = useMemo(
    () => ({
      async createTrip(tripData) {
        const newTrip = await createTripRequest({
          place: tripData.place.trim(),
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          budget: Number(tripData.budget),
        });

        setTrips((currentTrips) => [newTrip, ...currentTrips]);
        setError('');
        return newTrip;
      },
      async deleteTrip(tripId) {
        await deleteTripRequest(tripId);
        setTrips((currentTrips) => currentTrips.filter((trip) => trip.id !== tripId));
        setError('');
      },
      async clearAllTrips() {
        await clearTripsRequest();
        setTrips([]);
        setError('');
      },
      async addExpense(tripId, expenseData) {
        const updatedTrip = await addExpenseRequest(tripId, {
          title: expenseData.title.trim(),
          spentAt: expenseData.spentAt.trim(),
          category: expenseData.category,
          amount: Number(expenseData.amount),
          date: expenseData.date,
        });

        setTrips((currentTrips) =>
          currentTrips.map((trip) =>
            trip.id === tripId ? updatedTrip : trip,
          ),
        );
        setError('');
      },
      async deleteExpense(tripId, expenseId) {
        const updatedTrip = await deleteExpenseRequest(tripId, expenseId);

        setTrips((currentTrips) =>
          currentTrips.map((trip) =>
            trip.id === tripId ? updatedTrip : trip,
          ),
        );
        setError('');
      },
    }),
    [],
  );

  return { trips, isLoading, error, ...actions };
}
