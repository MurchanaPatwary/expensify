# Expenscoonie Server

Express + PostgreSQL backend for the Expenscoonie React app.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set your PostgreSQL connection in `.env`:

```bash
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://username:password@host:5432/database
PGSSL=true
```

For Render:

- Local development from your laptop: use the **External Database URL**.
- Backend deployed on Render in the same region: use the **Internal Database URL**.

If you see `getaddrinfo ENOTFOUND dpg-...-a`, your local `.env` is using the Internal Database URL. Switch to the External tab in Render's Connect menu and paste that URL into `DATABASE_URL`.

3. Start the API:

```bash
npm run dev
```

The API runs on `http://localhost:5000` by default.

On startup, the server creates the `trips` and `expenses` tables if they do not already exist. You can also run the schema manually from `database/schema.sql`.

## Migrating Existing MongoDB Data

1. Export the old MongoDB `trips` collection as JSON from MongoDB Compass, Atlas, or `mongoexport`.

2. Import it into PostgreSQL:

```bash
node scripts/importMongoTrips.js ./trips.json
```

MongoDB `_id` values are replaced by PostgreSQL auto-generated ids. The API still returns `id` as a string, so the frontend can keep using the same field names.

## API Routes

- `GET /api/health`
- `GET /api/trips`
- `POST /api/trips`
- `DELETE /api/trips`
- `DELETE /api/trips/:tripId`
- `POST /api/trips/:tripId/expenses`
- `DELETE /api/trips/:tripId/expenses/:expenseId`

## Frontend Env

In the React app, set this if your server URL changes:

```bash
VITE_API_URL=http://localhost:5000/api
```
