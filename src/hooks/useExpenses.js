import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

const POLL_INTERVAL = 15000; // 15 seconds

export function useExpenses() {
  const [todayData, setTodayData] = useState({
    total: 0,
    count: 0,
    byCategory: {},
    data: [],
    date: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchToday = useCallback(async () => {
    try {
      const result = await api.getToday();
      if (result.success) {
        setTodayData(result);
        setError(null);
      } else {
        setError('Server responded with an unsuccessful status.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchToday();
    intervalRef.current = setInterval(fetchToday, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchToday]);

  const addEntry = useCallback(
    async ({ amount, description, category }) => {
      try {
        const result = await api.addManualEntry({ amount, description, category });
        if (result.success) {
          await fetchToday(); // refresh immediately
        }
        return result;
      } catch (err) {
        throw err;
      }
    },
    [fetchToday]
  );

  const deleteEntry = useCallback(
    async (id) => {
      try {
        await api.deleteEntry(id);
        await fetchToday(); // refresh
      } catch (err) {
        throw err;
      }
    },
    [fetchToday]
  );

  const refresh = useCallback(() => {
    fetchToday();
  }, [fetchToday]);

  return {
    todayData,
    loading,
    error,
    addEntry,
    deleteEntry,
    refresh,
  };
}

export function useMonthly(initialMonth) {
  const [month, setMonth] = useState(initialMonth || getCurrentMonth());
  const [monthlyData, setMonthlyData] = useState({
    total: 0,
    count: 0,
    byCategory: {},
    byDate: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .getMonthlySummary(month)
      .then((result) => {
        if (!cancelled && result.success) {
          setMonthlyData(result);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [month]);

  const prevMonth = useCallback(() => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, [month]);

  const nextMonth = useCallback(() => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, [month]);

  return {
    month,
    monthlyData,
    loading,
    prevMonth,
    nextMonth,
  };
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}