import { Router } from 'express';
import {
  addExpense,
  clearTrips,
  createTrip,
  deleteExpense,
  deleteTrip,
  getTrips,
} from '../controllers/tripController.js';

const router = Router();

router.route('/').get(getTrips).post(createTrip).delete(clearTrips);
router.route('/:tripId').delete(deleteTrip);
router.route('/:tripId/expenses').post(addExpense);
router.route('/:tripId/expenses/:expenseId').delete(deleteExpense);

export default router;
