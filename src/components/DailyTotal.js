import React from 'react';
import { formatCurrency } from './Header';

export function DailyTotal({ total, count, currentMode, totalImports, totalPaid, netDue }) {
  if (currentMode === 'office') {
    return (
      <section className="daily-total daily-total--office" id="daily-total-card">
        <div className="daily-total__label" style={{ color: 'var(--accent-green)', letterSpacing: '1.5px', marginBottom: 'var(--space-xs)' }}>
          🏢 China Import Owed Balance
        </div>
        <div className="daily-total__amount" style={{ color: 'var(--accent-green)', fontSize: '2.8rem', marginBottom: 'var(--space-xs)' }}>
          {formatCurrency(netDue)}
        </div>
        <div className="daily-total__count" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Outstanding dues remaining to pay this month
        </div>
        
        <div className="office-dashboard-mini" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-md)',
          marginTop: 'var(--space-md)',
          paddingTop: 'var(--space-md)',
          borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Products Taken
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {formatCurrency(totalImports)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Paid to Brother
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-green)', marginTop: '2px' }}>
              {formatCurrency(totalPaid)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="daily-total daily-total--home" id="daily-total-card">
      <div className="daily-total__label">Today's Spend (Personal)</div>
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
