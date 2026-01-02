export const DIMENSIONS = {
  OVERWORLD: 0,
  NETHER: 1,
  END: 2,
};

export const DIMENSION_NAMES = {
  [DIMENSIONS.OVERWORLD]: 'Overworld',
  [DIMENSIONS.NETHER]: 'Nether',
  [DIMENSIONS.END]: 'End',
};

export const getDimensionName = (dim) => {
  return DIMENSION_NAMES[dim] || 'Unknown';
};

