import React, { useMemo } from 'react';
import { useMonthly } from '../hooks/useExpenses';
import { formatCurrency, getCategoryColor } from './Header';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthlyView() {
  const { month, monthlyData, loading, prevMonth, nextMonth } = useMonthly();

  const [year, m] = month.split('-').map(Number);
  const monthLabel = `${MONTH_NAMES[m - 1]} ${year}`;

  // Chronologically sort data into daily ledger buckets
  const structuralDayLogs = useMemo(() => {
    const rawEntries = monthlyData.data || []; 
    const groups = {};

    rawEntries.forEach((entry) => {
      const targetDate = entry.date; // Expects "YYYY-MM-DD"
      if (!groups[targetDate]) {
        groups[targetDate] = {
          dateString: targetDate,
          totalSpend: 0,
          records: []
        };
      }
      groups[targetDate].records.push(entry);
      groups[targetDate].totalSpend += entry.amount;
    });

    // Arrange downward matching true financial ledgers
    return Object.values(groups).sort((a, b) => b.dateString.localeCompare(a.dateString));
  }, [monthlyData.data]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__spinner" />
        <div className="loading__text">Loading historical hisab...</div>
      </div>
    );
  }

  return (
    <div className="monthly" id="monthly-view">
      {/* Month Navigation Row Control */}
      <div className="monthly__header">
        <button className="monthly__nav-btn" onClick={prevMonth} aria-label="Prev month">←</button>
        <span className="monthly__month-label">{monthLabel}</span>
        <button className="monthly__nav-btn" onClick={nextMonth} aria-label="Next month">→</button>
      </div>

      {/* Aggregate Cumulative Total Card Summary */}
      <div className="monthly__total-card">
        <div className="monthly__total-label">Monthly Total Accumulated</div>
        <div className="monthly__total-amount">
          {formatCurrency(monthlyData.total || 0)}
        </div>
      </div>

      {/* Unified Timeline Stack List View */}
      <section className="entries-section">
        <h3 className="entries-section__title">📅 Chronological Statement Ledgers</h3>
        
        {structuralDayLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📊</div>
            <div className="empty-state__text">No statements indexed for {monthLabel}</div>
          </div>
        ) : (
          structuralDayLogs.map((dayGroup) => {
            const humanReadableDay = new Date(dayGroup.dateString).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              weekday: 'short'
            });

            return (
              <div key={dayGroup.dateString} className="statement-day">
                {/* Header Container Banner Row for the Day */}
                <div className="statement-day__header">
                  <span className="statement-day__title">{humanReadableDay}</span>
                  <span className="statement-day__total">{formatCurrency(dayGroup.totalSpend)}</span>
                </div>

                {/* All mapped logs recorded during that calendar period */}
                <div className="statement-day__rows">
                  {dayGroup.records.map((entry) => (
                    <div key={entry._id} className="statement-row">
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                        <div className="statement-row__desc">{entry.description}</div>
                        
                        {/* Nested Itemized Breakdown Row Chips */}
                        {entry.items && entry.items.length > 0 && (
                          <div className="statement-row__sub-items">
                            {entry.items.map((sub, idx) => (
                              <span key={idx} className="statement-sub-pill">
                                {sub.name} &times; {sub.quantity} (₹{sub.price})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div 
                        className="statement-row__amount" 
                        style={{ color: getCategoryColor(entry.category) }}
                      >
                        {formatCurrency(entry.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

export default MonthlyView;