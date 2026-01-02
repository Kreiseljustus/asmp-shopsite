import { useState, useEffect } from 'react';
import { fetchGraphs } from '../utils/api';

export function useGraphs() {
  const [graphs, setGraphs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGraphs = async () => {
      try {
        setLoading(true);
        const data = await fetchGraphs();
        setGraphs(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load graphs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGraphs();
  }, []);

  return { graphs, loading, error, setGraphs };
}

