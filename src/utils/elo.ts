export const calculateEloChange = (
  winnerRating: number,
  loserRating: number,
  kFactor: number = 32
): { winnerNewRating: number; loserNewRating: number } => {
  const expectedScoreWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedScoreLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  const winnerNewRating = Math.round(winnerRating + kFactor * (1 - expectedScoreWinner));
  const loserNewRating = Math.round(loserRating + kFactor * (0 - expectedScoreLoser));

  return {
    winnerNewRating,
    loserNewRating,
  };
};
