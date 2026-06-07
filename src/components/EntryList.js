import React from 'react';
import { formatCurrency, isPayment } from './Header';

export function EntryCard({ entry, onDelete }) {
  const time = new Date(entry.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isOffice = entry.category === 'office';
  const isOfficePayment = isOffice && isPayment(entry);

  let iconBg = 'rgba(108, 92, 231, 0.15)';
  let iconColor = '#a29bfe';
  let iconSymbol = '🏠';

  if (isOffice) {
    if (isOfficePayment) {
      iconBg = 'rgba(0, 184, 148, 0.15)'; // emerald bg
      iconColor = '#00b894'; // emerald green
      iconSymbol = '💸'; // Repayment
    } else {
      iconBg = 'rgba(0, 206, 201, 0.15)'; // cyan bg
      iconColor = '#00cec9'; // cyan color
      iconSymbol = '🏢'; // Product taken
    }
  }

  return (
    <div className="entry-card" id={`entry-${entry._id}`}>
      <div
        className="entry-card__icon"
        style={{
          background: iconBg,
          color: iconColor,
        }}
      >
        {iconSymbol}
      </div>

      <div className="entry-card__info">
        <div className="entry-card__desc" style={isOfficePayment ? { color: '#00cec9' } : {}}>
          {entry.description}
          {isOfficePayment && (
            <span style={{
              fontSize: '0.65rem',
              background: 'rgba(0, 184, 148, 0.12)',
              color: '#00b894',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              marginLeft: 'var(--space-sm)',
              fontWeight: 700,
              display: 'inline-block',
              verticalAlign: 'middle'
            }}>
              Repayment
            </span>
          )}
        </div>
        <div className="entry-card__meta">
          <span className="entry-card__source">
            🕒 {time}
          </span>
        </div>
      </div>

      <div className="entry-card__amount" style={isOfficePayment ? { color: '#00b894' } : {}}>
        {isOfficePayment ? '-' : ''}{formatCurrency(entry.amount)}
      </div>

      <button
        className="entry-card__delete"
        onClick={() => onDelete(entry._id)}
        title="Delete entry"
        aria-label="Delete entry"
      >
        ✕
      </button>
    </div>
  );
}

export function EntryList({ entries, onDelete }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📒</div>
        <div className="empty-state__text">
          No expenses logged yet today.
        </div>
        <div className="empty-state__hint">
          Add an expense below to get started ↓
        </div>
      </div>
    );
  }

  return (
    <section className="entries-section">
      <h2 className="entries-section__title">Today's Entries</h2>
      <div className="entry-list">
        {entries.map((entry) => (
          <EntryCard
            key={entry._id}
            entry={entry}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

export default EntryList;
