const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong with the server.');
  }

  return data;
}

export function fetchTrips() {
  return request('/trips');
}

export function createTripRequest(tripData) {
  return request('/trips', {
    method: 'POST',
    body: JSON.stringify(tripData),
  });
}

export function deleteTripRequest(tripId) {
  return request(`/trips/${tripId}`, {
    method: 'DELETE',
  });
}

export function clearTripsRequest() {
  return request('/trips', {
    method: 'DELETE',
  });
}

export function addExpenseRequest(tripId, expenseData) {
  return request(`/trips/${tripId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });
}

export function deleteExpenseRequest(tripId, expenseId) {
  return request(`/trips/${tripId}/expenses/${expenseId}`, {
    method: 'DELETE',
  });
}
