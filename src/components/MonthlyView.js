import React, { useMemo } from 'react';
import { useMonthly } from '../hooks/useExpenses';
import { formatCurrency, isPayment } from './Header';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthlyView({ currentMode }) {
  const { month, monthlyData, loading, prevMonth, nextMonth } = useMonthly();

  const [year, m] = month.split('-').map(Number);
  const monthLabel = `${MONTH_NAMES[m - 1]} ${year}`;

  // Filter and tally cumulative monthly sum
  const filteredMonthlyTotal = useMemo(() => {
    const rawEntries = monthlyData.data || [];
    const officeEntries = rawEntries.filter((entry) => entry.category === 'office');

    if (currentMode === 'office') {
      const imports = officeEntries.filter((entry) => !isPayment(entry)).reduce((sum, item) => sum + (item.amount || 0), 0);
      const paid = officeEntries.filter((entry) => isPayment(entry)).reduce((sum, item) => sum + (item.amount || 0), 0);
      return Math.max(0, imports - paid);
    } else {
      return rawEntries
        .filter((entry) => entry.category !== 'office')
        .reduce((sum, item) => sum + (item.amount || 0), 0);
    }
  }, [monthlyData.data, currentMode]);

  // Compute breakouts for office view
  const officeBreakouts = useMemo(() => {
    if (currentMode !== 'office') return null;
    const rawEntries = monthlyData.data || [];
    const officeEntries = rawEntries.filter((entry) => entry.category === 'office');
    const imports = officeEntries.filter((entry) => !isPayment(entry)).reduce((sum, item) => sum + (item.amount || 0), 0);
    const paid = officeEntries.filter((entry) => isPayment(entry)).reduce((sum, item) => sum + (item.amount || 0), 0);
    return { imports, paid };
  }, [monthlyData.data, currentMode]);

  // Chronologically sort data into daily ledger buckets
  const structuralDayLogs = useMemo(() => {
    const rawEntries = monthlyData.data || [];
    const groups = {};

    const filteredEntries = rawEntries.filter((entry) => {
      if (currentMode === 'office') {
        return entry.category === 'office';
      } else {
        return entry.category !== 'office';
      }
    });

    filteredEntries.forEach((entry) => {
      const targetDate = entry.date; // Expects "YYYY-MM-DD"
      if (!groups[targetDate]) {
        groups[targetDate] = {
          dateString: targetDate,
          totalSpend: 0,
          records: [],
        };
      }
      groups[targetDate].records.push(entry);
      
      const change = currentMode === 'office' && isPayment(entry) ? -entry.amount : entry.amount;
      groups[targetDate].totalSpend += change;
    });

    // Arrange downward matching true financial ledgers
    return Object.values(groups).sort((a, b) => b.dateString.localeCompare(a.dateString));
  }, [monthlyData.data, currentMode]);

  if (loading) {
    return (
      <div className="loading" style={{ margin: 'var(--space-2xl) 0' }}>
        <div className="loading__spinner" />
        <div className="loading__text">Loading historical hisab...</div>
      </div>
    );
  }

  return (
    <div className="monthly" id="monthly-view">
      {/* Month Navigation Row Control */}
      <div className="monthly__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <button className="monthly__nav-btn" onClick={prevMonth} aria-label="Prev month">←</button>
        <span className="monthly__month-label">{monthLabel}</span>
        <button className="monthly__nav-btn" onClick={nextMonth} aria-label="Next month">→</button>
      </div>

      {/* Aggregate Cumulative Total Card Summary */}
      <div className="monthly__total-card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="monthly__total-label">
          {currentMode === 'office' ? 'Month-End Outstanding Due' : 'Monthly Total Accumulated (Personal)'}
        </div>
        <div className="monthly__total-amount" style={currentMode === 'office' ? { color: 'var(--accent-green)' } : {}}>
          {formatCurrency(filteredMonthlyTotal)}
        </div>
        {currentMode === 'office' && officeBreakouts && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
            fontSize: '0.8rem',
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Total Imports:</span>{' '}
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(officeBreakouts.imports)}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Total Repaid:</span>{' '}
              <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{formatCurrency(officeBreakouts.paid)}</span>
            </div>
          </div>
        )}
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
              weekday: 'short',
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
                  {dayGroup.records.map((entry) => {
                    const isRecRepayment = currentMode === 'office' && isPayment(entry);
                    return (
                      <div key={entry._id} className="statement-row">
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                          <div className="statement-row__desc" style={isRecRepayment ? { color: '#00cec9' } : {}}>
                            {entry.description}
                            {isRecRepayment && (
                              <span style={{
                                fontSize: '0.6rem',
                                background: 'rgba(0, 184, 148, 0.12)',
                                color: '#00b894',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                marginLeft: '6px',
                                fontWeight: 700,
                                display: 'inline-block'
                              }}>
                                Repayment
                              </span>
                            )}
                          </div>

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
                          style={isRecRepayment ? { color: '#00b894' } : {}}
                        >
                          {isRecRepayment ? '-' : ''}{formatCurrency(entry.amount)}
                        </div>
                      </div>
                    );
                  })}
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
