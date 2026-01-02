const API_BASE = '/asmp/api';

export const fetchShops = async () => {
  const response = await fetch(`${API_BASE}/shops`);
  if (!response.ok) throw new Error('Failed to fetch shops');
  return response.json();
};

export const fetchWaystones = async () => {
  const response = await fetch(`${API_BASE}/waystones`);
  if (!response.ok) throw new Error('Failed to fetch waystones');
  return response.json();
};

export const fetchGraphs = async () => {
  const response = await fetch(`${API_BASE}/graphs`);
  if (!response.ok) throw new Error('Failed to fetch graphs');
  return response.json();
};

export const fetchNews = async () => {
  const response = await fetch(`${API_BASE}/news`);
  if (!response.ok) throw new Error('Failed to fetch news');
  return response.json();
};

export const deleteShop = async (shopData) => {
  const response = await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'shop', data: shopData }),
  });
  if (!response.ok) throw new Error('Failed to delete shop');
  return response.json();
};

export const deleteWaystone = async (waystoneData) => {
  const response = await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'waystone', data: waystoneData }),
  });
  if (!response.ok) throw new Error('Failed to delete waystone');
  return response.json();
};

