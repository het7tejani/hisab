import React from 'react';

export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

export function isPayment(entry) {
  if (!entry || !entry.description) return false;
  const desc = entry.description.toLowerCase();
  return (
    desc.includes('repayment') ||
    desc.includes('repay') ||
    desc.includes('paid to brother') ||
    desc.includes('payment to brother') ||
    desc.includes('pay due') ||
    desc.includes('due pay') ||
    desc.includes('payment made')
  );
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
        <h1 className="header__title">Hisab</h1>
      </div>
      <time className="header__date">{dateStr}</time>
    </header>
  );
}

export default Header;
