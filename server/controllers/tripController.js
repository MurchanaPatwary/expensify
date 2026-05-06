import {
  addExpenseRecord,
  createTripRecord,
  deleteAllTrips,
  deleteExpenseById,
  deleteTripById,
  findTrips,
} from '../models/Trip.js';

function toClientExpense(expense) {
  return {
    id: expense.id,
    title: expense.title,
    spentAt: expense.spentAt,
    category: expense.category,
    amount: expense.amount,
    date: expense.date,
    createdAt: expense.createdAt ? new Date(expense.createdAt).getTime() : undefined,
  };
}

function toClientTrip(trip) {
  return {
    id: trip.id,
    place: trip.place,
    startDate: trip.startDate,
    endDate: trip.endDate,
    budget: trip.budget,
    expenses: (trip.expenses || []).map(toClientExpense).reverse(),
    createdAt: trip.createdAt ? new Date(trip.createdAt).getTime() : undefined,
  };
}

function requireFields(body, fields) {
  const missingFields = fields.filter((field) => body[field] === undefined || body[field] === '');

  if (missingFields.length) {
    const error = new Error(`Missing required field(s): ${missingFields.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
}

export async function getTrips(_req, res) {
  const trips = await findTrips();
  res.json(trips.map(toClientTrip));
}

export async function createTrip(req, res) {
  requireFields(req.body, ['place', 'startDate', 'endDate', 'budget']);

  const trip = await createTripRecord({
    place: req.body.place,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    budget: req.body.budget,
  });

  res.status(201).json(toClientTrip(trip));
}

export async function deleteTrip(req, res) {
  const deleted = await deleteTripById(req.params.tripId);

  if (!deleted) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  return res.status(204).send();
}

export async function clearTrips(_req, res) {
  await deleteAllTrips();
  res.status(204).send();
}

export async function addExpense(req, res) {
  requireFields(req.body, ['title', 'spentAt', 'category', 'amount', 'date']);

  const trip = await addExpenseRecord(req.params.tripId, {
    title: req.body.title,
    spentAt: req.body.spentAt,
    category: req.body.category,
    amount: req.body.amount,
    date: req.body.date,
  });

  if (!trip) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  return res.status(201).json(toClientTrip(trip));
}

export async function deleteExpense(req, res) {
  const { trip, expenseDeleted } = await deleteExpenseById(req.params.tripId, req.params.expenseId);

  if (!trip) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  if (!expenseDeleted) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  return res.json(toClientTrip(trip));
}
