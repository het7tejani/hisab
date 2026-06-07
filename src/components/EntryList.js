import React from 'react';
import { formatCurrency } from './Header';

export function EntryCard({ entry, onDelete }) {
  const time = new Date(entry.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="entry-card" id={`entry-${entry._id}`}>
      <div
        className="entry-card__icon"
        style={{
          background: 'rgba(108, 92, 231, 0.15)',
          color: '#a29bfe',
        }}
      >
        📝
      </div>

      <div className="entry-card__info">
        <div className="entry-card__desc">{entry.description}</div>
        <div className="entry-card__meta">
          <span className="entry-card__source">
            🕒 {time}
          </span>
        </div>
      </div>

      <div className="entry-card__amount">{formatCurrency(entry.amount)}</div>

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
