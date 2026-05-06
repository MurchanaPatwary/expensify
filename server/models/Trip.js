import { pool } from '../config/db.js';

function toExpense(row) {
  if (!row.expense_id) {
    return null;
  }

  return {
    id: String(row.expense_id),
    title: row.title,
    spentAt: row.spent_at,
    category: row.category,
    amount: Number(row.amount),
    date: row.expense_date,
    createdAt: row.expense_created_at,
  };
}

function toTrip(row) {
  return {
    id: String(row.id),
    place: row.place,
    startDate: row.start_date,
    endDate: row.end_date,
    budget: Number(row.budget),
    expenses: [],
    createdAt: row.created_at,
  };
}

function mapTripRows(rows) {
  const trips = new Map();

  for (const row of rows) {
    if (!trips.has(row.id)) {
      trips.set(row.id, toTrip(row));
    }

    const expense = toExpense(row);
    if (expense) {
      trips.get(row.id).expenses.push(expense);
    }
  }

  return [...trips.values()];
}

export async function findTrips() {
  const { rows } = await pool.query(`
    SELECT
      t.id,
      t.place,
      t.start_date,
      t.end_date,
      t.budget,
      t.created_at,
      e.id AS expense_id,
      e.title,
      e.spent_at,
      e.category,
      e.amount,
      e.expense_date,
      e.created_at AS expense_created_at
    FROM trips t
    LEFT JOIN expenses e ON e.trip_id = t.id
    ORDER BY t.created_at DESC, e.created_at ASC, e.id ASC
  `);

  return mapTripRows(rows);
}

export async function findTripById(tripId) {
  const { rows } = await pool.query(
    `
      SELECT
        t.id,
        t.place,
        t.start_date,
        t.end_date,
        t.budget,
        t.created_at,
        e.id AS expense_id,
        e.title,
        e.spent_at,
        e.category,
        e.amount,
        e.expense_date,
        e.created_at AS expense_created_at
      FROM trips t
      LEFT JOIN expenses e ON e.trip_id = t.id
      WHERE t.id = $1
      ORDER BY e.created_at ASC, e.id ASC
    `,
    [tripId],
  );

  return mapTripRows(rows)[0] || null;
}

export async function createTripRecord({ place, startDate, endDate, budget }) {
  const { rows } = await pool.query(
    `
      INSERT INTO trips (place, start_date, end_date, budget)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [place.trim(), startDate, endDate, Number(budget)],
  );

  return findTripById(rows[0].id);
}

export async function deleteTripById(tripId) {
  const result = await pool.query('DELETE FROM trips WHERE id = $1', [tripId]);
  return result.rowCount > 0;
}

export async function deleteAllTrips() {
  await pool.query('DELETE FROM trips');
}

export async function addExpenseRecord(tripId, { title, spentAt, category, amount, date }) {
  const trip = await findTripById(tripId);

  if (!trip) {
    return null;
  }

  await pool.query(
    `
      INSERT INTO expenses (trip_id, title, spent_at, category, amount, expense_date)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [tripId, title.trim(), spentAt.trim(), category.trim(), Number(amount), date],
  );

  return findTripById(tripId);
}

export async function deleteExpenseById(tripId, expenseId) {
  const trip = await findTripById(tripId);

  if (!trip) {
    return { trip: null, expenseDeleted: false };
  }

  const result = await pool.query('DELETE FROM expenses WHERE id = $1 AND trip_id = $2', [
    expenseId,
    tripId,
  ]);

  return {
    trip: await findTripById(tripId),
    expenseDeleted: result.rowCount > 0,
  };
}
