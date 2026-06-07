const API_BASE = process.env.REACT_APP_API_URL || 'https://hvetsna-data.onrender.com';

const api = {
  // Get today's entries + summary
  async getToday() {
    const res = await fetch(`${API_BASE}/api/v1/hisab/today`);
    if (!res.ok) throw new Error('Failed to fetch today data');
    return res.json();
  },

  // Get entries for a specific date
  async getEntries(date) {
    const url = date
      ? `${API_BASE}/api/v1/hisab/entries?date=${date}`
      : `${API_BASE}/api/v1/hisab/entries`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch entries');
    return res.json();
  },

  // Get monthly summary
  async getMonthlySummary(month) {
    const url = month
      ? `${API_BASE}/api/v1/hisab/monthly?month=${month}`
      : `${API_BASE}/api/v1/hisab/monthly`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch monthly data');
    return res.json();
  },

  // Add manual entry
  async addManualEntry({ amount, description, category }) {
    const res = await fetch(`${API_BASE}/api/v1/hisab/manual-entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description, category }),
    });
    if (!res.ok) throw new Error('Failed to add entry');
    return res.json();
  },

  // Delete entry
  async deleteEntry(id) {
    const res = await fetch(`${API_BASE}/api/v1/hisab/entries/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete entry');
    return res.json();
  },
};

export { API_BASE };
export default api;
