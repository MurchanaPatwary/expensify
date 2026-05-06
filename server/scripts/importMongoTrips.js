import fs from 'node:fs/promises';
import { connectDB, pool } from '../config/db.js';

function normalizeMongoValue(value) {
  if (value && typeof value === 'object') {
    if ('$date' in value) {
      return value.$date;
    }

    if ('$numberDecimal' in value) {
      return value.$numberDecimal;
    }
  }

  return value;
}

function parseExport(content) {
  const trimmed = content.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }

  return trimmed
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function sqlDate(value) {
  const normalized = normalizeMongoValue(value);

  if (!normalized) {
    return null;
  }

  return new Date(normalized);
}

async function importTrip(trip) {
  const { rows } = await pool.query(
    `
      INSERT INTO trips (place, start_date, end_date, budget, created_at, updated_at)
      VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP), COALESCE($6, CURRENT_TIMESTAMP))
      RETURNING id
    `,
    [
      trip.place,
      trip.startDate,
      trip.endDate,
      Number(normalizeMongoValue(trip.budget)),
      sqlDate(trip.createdAt),
      sqlDate(trip.updatedAt),
    ],
  );

  for (const expense of trip.expenses || []) {
    await pool.query(
      `
        INSERT INTO expenses (
          trip_id,
          title,
          spent_at,
          category,
          amount,
          expense_date,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_TIMESTAMP), COALESCE($8, CURRENT_TIMESTAMP))
      `,
      [
        rows[0].id,
        expense.title,
        expense.spentAt,
        expense.category,
        Number(normalizeMongoValue(expense.amount)),
        expense.date,
        sqlDate(expense.createdAt),
        sqlDate(expense.updatedAt),
      ],
    );
  }
}

async function main() {
  const exportPath = process.argv[2];

  if (!exportPath) {
    throw new Error('Usage: node scripts/importMongoTrips.js <mongo-trips-export.json>');
  }

  await connectDB();

  const content = await fs.readFile(exportPath, 'utf8');
  const trips = parseExport(content);

  for (const trip of trips) {
    await importTrip(trip);
  }

  console.log(`Imported ${trips.length} trip(s) into PostgreSQL.`);
  await pool.end();
}

main().catch(async (error) => {
  console.error(error.message);
  await pool.end();
  process.exit(1);
});
