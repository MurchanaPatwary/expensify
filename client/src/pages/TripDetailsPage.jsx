import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, IndianRupee, PiggyBank, Receipt } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import HeroBanner from '../components/HeroBanner.jsx';
import Snackbar from '../components/Snackbar.jsx';
import StatCard from '../components/StatCard.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import { useTrips } from '../hooks/useTrips.js';
import {
  createExpenseForm,
  formatCurrency,
  formatDate,
  getTripRemaining,
  getTripSpent,
} from '../utils/tripHelpers.js';

function TripDetailsPage() {
  const { tripId } = useParams();
  const { trips, isLoading, error, addExpense, deleteExpense } = useTrips();
  const trip = useMemo(() => trips.find((item) => item.id === tripId) || null, [trips, tripId]);
  const [expenseForm, setExpenseForm] = useState(createExpenseForm);
  const [expenseError, setExpenseError] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState('');
  const [confirmExpenseId, setConfirmExpenseId] = useState('');
  const [snackbar, setSnackbar] = useState(null);

  useEffect(() => {
    if (trip) {
      setExpenseForm((current) => ({
        ...current,
        date: current.date || trip.startDate || '',
      }));
    }
  }, [trip]);

  if (isLoading) {
    return (
      <div className="empty-state compact-empty-state">
        <p>Loading trip details from MongoDB...</p>
      </div>
    );
  }

  if (!trip) {
    return <Navigate to="/" replace />;
  }

  const totalSpent = getTripSpent(trip);
  const remainingBudget = getTripRemaining(trip);

  const updateExpenseForm = (field, value) => {
    setExpenseForm((current) => ({ ...current, [field]: value }));
    setExpenseError('');
  };

  const handleAddExpense = async (event) => {
    event.preventDefault();

    if (
      !expenseForm.title.trim() ||
      !expenseForm.spentAt.trim() ||
      !expenseForm.amount ||
      !expenseForm.date
    ) {
      setExpenseError('Expense title, location, amount, and date are required.');
      return;
    }

    if (Number(expenseForm.amount) <= 0) {
      setExpenseError('Amount must be greater than zero.');
      return;
    }

    try {
      setIsAddingExpense(true);
      await addExpense(trip.id, expenseForm);
      setSnackbar({ message: `${expenseForm.title.trim()} expense added successfully.` });
      setExpenseForm({
        ...createExpenseForm(),
        date: trip.startDate || '',
      });
    } catch (serverError) {
      setExpenseError(serverError.message);
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    setConfirmExpenseId(expenseId);
  };

  const deleteConfirmedExpense = async () => {
    const expenseToDelete = trip.expenses.find((expense) => expense.id === confirmExpenseId);
    const expenseId = confirmExpenseId;
    setConfirmExpenseId('');
    try {
      setDeletingExpenseId(expenseId);
      await deleteExpense(trip.id, expenseId);
      setSnackbar({ message: `${expenseToDelete?.title || 'Expense'} deleted successfully.` });
    } catch (serverError) {
      setExpenseError(serverError.message);
    } finally {
      setDeletingExpenseId('');
    }
  };

  const confirmExpense = trip.expenses.find((expense) => expense.id === confirmExpenseId);

  return (
    <div className="detail-dashboard">
      <div className="page-back-row">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Back to trips
        </Link>
      </div>

      <HeroBanner
        eyebrow="Trip Expense History"
        title={trip.place}
        description="Add every expense for this place here. Each entry reduces the budget and updates the remaining amount live."
        className="detail-hero"
      >
        <StatCard
          label="Date Range"
          value={`${formatDate(trip.startDate)} to ${formatDate(trip.endDate)}`}
          highlight
        />
        <StatCard label="Total Budget" value={formatCurrency(trip.budget)} />
        <StatCard
          label="Remaining Budget"
          value={formatCurrency(remainingBudget)}
          valueClassName={remainingBudget >= 0 ? 'positive' : 'negative'}
        />
      </HeroBanner>

      <section className="home-main-grid detail-main-grid">
        <div className="home-left-column detail-left-column">
          <ExpenseForm
            form={expenseForm}
            onChange={updateExpenseForm}
            onSubmit={handleAddExpense}
            error={expenseError || error}
            isSubmitting={isAddingExpense}
          />

          <div className="summary-stack compact-summary-stack detail-summary-grid">
            <SummaryCard
              icon={<IndianRupee size={18} />}
              label="Spent So Far"
              value={formatCurrency(totalSpent)}
              description="Total amount spent on this trip so far."
            />
            <SummaryCard
              icon={<PiggyBank size={18} />}
              label="Budget Left"
              value={formatCurrency(remainingBudget)}
              valueClassName={remainingBudget >= 0 ? 'positive' : 'negative'}
              description="This amount updates automatically after each new expense."
              accent="savings-card"
            />
            <SummaryCard
              icon={<Receipt size={18} />}
              label="Total Entries"
              value={trip.expenses.length}
              description="Saved expense records for this place."
            />
          </div>
        </div>

        <section className="panel ledger-panel trip-list-panel detail-expense-panel">
          <div className="section-heading compact-heading">
            <div className="icon-wrap">
              <Receipt size={18} />
            </div>
            <div>
              <h2>{trip.place} Expense History</h2>
              <p>All expenses for this trip are listed here.</p>
            </div>
          </div>

          <div className="expense-list-shell">
            <ExpenseList
              expenses={trip.expenses}
              onDelete={handleDeleteExpense}
              emptyMessage="No expenses have been added for this trip yet."
              isAdding={isAddingExpense}
              deletingExpenseId={deletingExpenseId}
            />
          </div>
        </section>
      </section>
      <ConfirmDialog
        isOpen={Boolean(confirmExpenseId)}
        title="Delete expense?"
        message={`This will remove ${confirmExpense?.title || 'this expense'} from ${trip.place}.`}
        confirmLabel="Delete Expense"
        onCancel={() => setConfirmExpenseId('')}
        onConfirm={deleteConfirmedExpense}
      />
      <Snackbar snackbar={snackbar} onClose={() => setSnackbar(null)} />
    </div>
  );
}

export default TripDetailsPage;
