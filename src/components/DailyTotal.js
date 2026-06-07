import React from 'react';
import { formatCurrency, getCategoryColor } from './Header';

export function DailyTotal({ total, count, byCategory }) {
  return (
    <section className="daily-total" id="daily-total-card">
      <div className="daily-total__label">Today's Spend</div>
      <div className="daily-total__amount">{formatCurrency(total)}</div>
      <div className="daily-total__count">
        {count === 0
          ? 'No expenses yet — say "Hey Google, log expense..."'
          : `${count} expense${count > 1 ? 's' : ''} today`}
      </div>

      {byCategory && Object.keys(byCategory).length > 0 && (
        <div className="categories">
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => (
              <span className="category-pill" key={cat}>
                <span
                  className="category-pill__dot"
                  style={{ backgroundColor: getCategoryColor(cat) }}
                />
                {cat} · {formatCurrency(amount)}
              </span>
            ))}
        </div>
      )}
    </section>
  );
}

export default DailyTotal;
