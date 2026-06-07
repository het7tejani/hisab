import React from 'react';

const CATEGORY_ICONS = {
  food: '🍔',
  transport: '🚕',
  fuel: '⛽',
  groceries: '🥬',
  medicine: '💊',
  shopping: '🛍️',
  bills: '📄',
  entertainment: '🎬',
  chai: '☕',
  misc: '📌',
};

const CATEGORY_COLORS = {
  food: '#fdcb6e',
  transport: '#74b9ff',
  fuel: '#e17055',
  groceries: '#00b894',
  medicine: '#ff6b6b',
  shopping: '#fd79a8',
  bills: '#a29bfe',
  entertainment: '#ffeaa7',
  chai: '#e17055',
  misc: '#636e72',
};

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || '📌';
}

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#636e72';
}

export function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
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
    <header className="header">
      <div className="header__brand">
        <div className="header__logo">📒</div>
        <h1 className="header__title">Hisab</h1>
      </div>
      <time className="header__date">{dateStr}</time>
    </header>
  );
}

export default Header;
