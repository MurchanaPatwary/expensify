import React from 'react';
import { Wallet2 } from 'lucide-react';
import { categoryOptions } from '../utils/tripHelpers.js';

function ExpenseForm({ form, onChange, onSubmit, error, isSubmitting = false }) {
  return (
    <form className="panel expense-panel" onSubmit={onSubmit}>
      <div className="section-heading">
        <div className="icon-wrap">
          <Wallet2 size={16} />
        </div>
        <div>
          <h2>Add Expense</h2>
          <p>Record the amount, location, category, and date.</p>
        </div>
      </div>

      <div className="field-grid">
        <label className="field field-wide">
          <span>What did you spend on?</span>
          <input
            type="text"
            placeholder="Dinner, Tickets, Clothes"
            value={form.title}
            onChange={(event) => onChange('title', event.target.value)}
          />
        </label>

        <label className="field">
          <span>Where did you spend?</span>
          <input
            type="text"
            placeholder="Museum, Cafe, Station"
            value={form.spentAt}
            onChange={(event) => onChange('spentAt', event.target.value)}
          />
        </label>

        <label className="field">
          <span>Category</span>
          <select
            value={form.category}
            onChange={(event) => onChange('category', event.target.value)}
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Amount spent?</span>
          <input
            type="number"
            min="0"
            placeholder="1200"
            value={form.amount}
            onChange={(event) => onChange('amount', event.target.value)}
          />
        </label>

        <label className="field">
          <span>When?</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => onChange('date', event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="message">{error}</p> : null}

      <button type="submit" className="primary-button full-width" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="button-loader" aria-label="Saving expense" />
        ) : (
          'Save Expense'
        )}
      </button>
    </form>
  );
}

export default ExpenseForm;
