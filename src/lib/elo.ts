export const getEloTier = (elo: number): string => {
  if (elo >= 2500) {
    return "S+ tier";
  }
  if (elo >= 2400) {
    return "S tier";
  }
  if (elo >= 2300) {
    return "A+ tier";
  }
  if (elo >= 2200) {
    return "A tier";
  }
  if (elo >= 2100) {
    return "B+ tier";
  }
  if (elo >= 2000) {
    return "B tier";
  }
  if (elo >= 1900) {
    return "C+ tier";
  }
  if (elo >= 1800) {
    return "C tier";
  }
  if (elo >= 1700) {
    return "D+ tier";
  }
  if (elo >= 1600) {
    return "D tier";
  }
  return "F tier";
};
