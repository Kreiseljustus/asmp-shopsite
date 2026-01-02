export const ACTIONS = {
  BUYING: 0,
  SELLING: 1,
  OUT_OF_STOCK: 2,
};

export const ACTION_NAMES = {
  [ACTIONS.BUYING]: 'Buying',
  [ACTIONS.SELLING]: 'Selling',
  [ACTIONS.OUT_OF_STOCK]: 'Out of Stock',
};

export const getActionName = (action) => {
  return ACTION_NAMES[action] || 'Unknown';
};

