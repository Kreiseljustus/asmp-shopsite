import { useState, useEffect } from 'react';
import { fetchWaystones } from '../utils/api';

export function useWaystones() {
  const [waystones, setWaystones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWaystones = async () => {
      try {
        setLoading(true);
        const data = await fetchWaystones();
        setWaystones(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load waystones:', err);
      } finally {
        setLoading(false);
      }
    };
    loadWaystones();
  }, []);

  return { waystones, loading, error, setWaystones };
}

