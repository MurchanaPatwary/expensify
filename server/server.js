import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import tripRoutes from './routes/tripRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = 'https://https://expensify-iota.vercel.app';

app.use(cors({
  origin: [
      'http://localhost:5173',        // local dev
      'https://expensify-iota.vercel.app'     // production frontend URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/trips', tripRoutes);
app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
