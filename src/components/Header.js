import React from 'react';

export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

export function Header() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="header" id="app-header">
      <div className="header__brand">
        <div className="header__logo">📒</div>
        <h1 className="header__title">Hisab Ledger</h1>
      </div>
      <time className="header__date">{dateStr}</time>
    </header>
  );
}

export default Header;
