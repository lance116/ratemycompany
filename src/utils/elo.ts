export type MatchOutcome = "a" | "b" | "draw";

export const calculateEloOutcome = (
  ratingA: number,
  ratingB: number,
  outcome: MatchOutcome,
  kFactor: number = 32
): { ratingA: number; ratingB: number } => {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  let scoreA: number;
  let scoreB: number;
  switch (outcome) {
    case "a":
      scoreA = 1;
      scoreB = 0;
      break;
    case "b":
      scoreA = 0;
      scoreB = 1;
      break;
    case "draw":
    default:
      scoreA = 0.5;
      scoreB = 0.5;
      break;
  }

  const newRatingA = Math.round(ratingA + kFactor * (scoreA - expectedA));
  const newRatingB = Math.round(ratingB + kFactor * (scoreB - expectedB));

  return {
    ratingA: newRatingA,
    ratingB: newRatingB,
  };
};
