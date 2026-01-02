import { useState, useEffect } from 'react';
import { fetchShops } from '../utils/api';

export function useShops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadShops = async () => {
      try {
        setLoading(true);
        const data = await fetchShops();
        setShops(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load shops:', err);
      } finally {
        setLoading(false);
      }
    };
    loadShops();
  }, []);

  return { shops, loading, error, setShops };
}

