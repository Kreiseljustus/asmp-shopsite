import { getDimensionName } from '../constants/dimensions';
import { getActionName } from '../constants/actions';

export const filterShops = (shops, filters) => {
  const { searchQuery, showBuying, showSelling, showOutOfStock, dimensionFilter } = filters;
  
  let filtered = [...shops];

  // Search filter
  if (searchQuery) {
    const terms = searchQuery.toLowerCase().split(';').map(t => t.trim()).filter(t => t);
    filtered = filtered.filter(item => {
      const text = `${item.Owner} ${item.item} ${getActionName(item.action)} ${item.price} ${item.amount} [${item.position.join(', ')}] ${getDimensionName(item.dimension)}`.toLowerCase();
      return terms.some(term => text.includes(term));
    });
  }

  // Action filters
  if (!showBuying) {
    filtered = filtered.filter(item => item.action !== 0);
  }
  if (!showSelling) {
    filtered = filtered.filter(item => item.action !== 1);
  }
  if (!showOutOfStock) {
    filtered = filtered.filter(item => item.action !== 2);
  }

  // Dimension filter
  if (dimensionFilter) {
    filtered = filtered.filter(item => getDimensionName(item.dimension) === dimensionFilter);
  }

  return filtered;
};

export const filterWaystones = (waystones, filters) => {
  const { searchQuery, dimensionFilter } = filters;
  
  let filtered = [...waystones];

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(ws => {
      const text = `${ws.Owner} ${ws.Name} [${ws.position.join(', ')}] ${getDimensionName(ws.dimension)}`.toLowerCase();
      return text.includes(query);
    });
  }

  // Dimension filter
  if (dimensionFilter) {
    filtered = filtered.filter(ws => getDimensionName(ws.dimension) === dimensionFilter);
  }

  return filtered;
};

export const sortWaystonesByDistance = (waystones, x, y, z) => {
  if (isNaN(x) || isNaN(y) || isNaN(z)) return waystones;

  return [...waystones].sort((a, b) => {
    const distA = Math.sqrt(
      Math.pow(a.position[0] - x, 2) +
      Math.pow(a.position[1] - y, 2) +
      Math.pow(a.position[2] - z, 2)
    );
    const distB = Math.sqrt(
      Math.pow(b.position[0] - x, 2) +
      Math.pow(b.position[1] - y, 2) +
      Math.pow(b.position[2] - z, 2)
    );
    return distA - distB;
  });
};

