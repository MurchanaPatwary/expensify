export const categoryOptions = [
  'Food',
  'Travel',
  'Shopping',
  'Stay',
  'Transport',
  'Entertainment',
  'Other',
];

export const createTripForm = () => ({
  place: '',
  startDate: '',
  endDate: '',
  budget: '',
});

export const createExpenseForm = () => ({
  title: '',
  spentAt: '',
  category: 'Food',
  amount: '',
  date: '',
});

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getTripSpent = (trip) =>
  trip.expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

export const getTripRemaining = (trip) => Number(trip.budget || 0) - getTripSpent(trip);
