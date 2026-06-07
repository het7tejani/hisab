import React from 'react';
import { formatCurrency } from './Header';

export function DailyTotal({ total, count }) {
  return (
    <section className="daily-total" id="daily-total-card">
      <div className="daily-total__label">Today's Spend</div>
      <div className="daily-total__amount">{formatCurrency(total)}</div>
      <div className="daily-total__count">
        {count === 0
          ? 'No expenses logged yet today'
          : `${count} expense${count > 1 ? 's' : ''} today`}
      </div>
    </section>
  );
}

export default DailyTotal;
