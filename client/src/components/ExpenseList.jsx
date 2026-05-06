import React from 'react';
import { Receipt, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/tripHelpers.js';

function ExpenseList({ expenses, onDelete, emptyMessage, isAdding = false, deletingExpenseId = '' }) {
  if (!expenses.length && !isAdding) {
    return (
      <div className="empty-state">
        <Receipt size={28} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      {isAdding ? (
        <article className="expense-item pending-item" aria-live="polite">
          <div className="expense-main">
            <h3>
              <span className="skeleton-line skeleton-title" />
            </h3>
            <div className="expense-meta">
              <span className="skeleton-line skeleton-chip" />
              <span className="skeleton-line skeleton-chip" />
            </div>
          </div>
          <div className="expense-actions">
            <span className="list-loader" aria-hidden="true" />
          </div>
        </article>
      ) : null}
      {expenses.map((expense) => (
        <article key={expense.id} className="expense-item">
          <div className="expense-main">
            <h3>{expense.title}</h3>
            <div className="expense-meta">
              <span className="meta-place">{expense.spentAt}</span>
              <span className="meta-category">{expense.category}</span>
              <span className="meta-date">{formatDate(expense.date)}</span>
            </div>
          </div>

          <div className="expense-actions">
            <strong>{formatCurrency(expense.amount)}</strong>
            <button
              type="button"
              className="icon-button"
              onClick={() => onDelete(expense.id)}
              disabled={deletingExpenseId === expense.id}
              aria-label={`Delete ${expense.title}`}
            >
              {deletingExpenseId === expense.id ? (
                <span className="button-loader danger-loader" aria-hidden="true" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default ExpenseList;
