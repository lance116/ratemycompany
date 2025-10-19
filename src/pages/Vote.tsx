import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLeaderboardCompanies,
  LeaderboardCompany,
  recordMatchup,
} from "@/data/companies";
import { calculateEloChange } from "@/utils/elo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayStats } from "@/components/ui/pay-stats";
import { Star, Trophy } from "lucide-react";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";

type CompanyPair = [LeaderboardCompany, LeaderboardCompany];

const defaultLogo = "https://placehold.co/160x160?text=Logo";

const Vote = () => {
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboardCompanies,
    staleTime: 1000 * 30,
  });

  const [currentPair, setCurrentPair] = useState<CompanyPair | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [votes, setVotes] = useState(0);
  const [winnerPosition, setWinnerPosition] = useState<"left" | "right" | null>(null);
  const [completedMatchups, setCompletedMatchups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (companies.length < 2) {
      return;
    }
    setCurrentPair(prev => {
      if (prev) {
        return prev;
      }
      return getRandomPair(companies, [], new Set());
    });
  }, [companies]);

  const companyPool = useMemo(() => companies, [companies]);

  const createMatchupKey = (company1: LeaderboardCompany, company2: LeaderboardCompany) => {
    const [id1, id2] = [company1.id, company2.id].sort((a, b) => a.localeCompare(b));
    return `${id1}-${id2}`;
  };

  const getRandomPair = (
    companiesList: LeaderboardCompany[],
    excludeIds: string[] = [],
    completedSet: Set<string> = new Set()
  ): CompanyPair => {
    const availableCompanies = companiesList.filter(company => !excludeIds.includes(company.id));
    const shuffled = [...availableCompanies].sort(() => 0.5 - Math.random());

    for (let i = 0; i < shuffled.length; i += 1) {
      for (let j = i + 1; j < shuffled.length; j += 1) {
        const matchupKey = createMatchupKey(shuffled[i], shuffled[j]);
        if (!completedSet.has(matchupKey)) {
          return [shuffled[i], shuffled[j]];
        }
      }
    }

    return [shuffled[0], shuffled[1]];
  };

  const getNextChallenger = (
    companiesList: LeaderboardCompany[],
    excludeIds: string[],
    winner: LeaderboardCompany,
    completedSet: Set<string> = new Set()
  ) => {
    const availableCompanies = companiesList.filter(company => !excludeIds.includes(company.id));
    const shuffled = [...availableCompanies].sort(() => 0.5 - Math.random());

    for (const company of shuffled) {
      const matchupKey = createMatchupKey(winner, company);
      if (!completedSet.has(matchupKey)) {
        return company;
      }
    }

    return shuffled[0];
  };

  const handleDontKnow = () => {
    if (!currentPair) {
      return;
    }

    const [leftCompany, rightCompany] = currentPair;

    if (!winnerPosition) {
      const newPair = getRandomPair(companyPool, [], completedMatchups);
      setCurrentPair(newPair);
    } else {
      const winnerId = winnerPosition === "left" ? leftCompany.id : rightCompany.id;
      const updatedWinner = companyPool.find(company => company.id === winnerId);
      const newChallenger = updatedWinner
        ? getNextChallenger(companyPool, [updatedWinner.id], updatedWinner, completedMatchups)
        : null;

      if (updatedWinner && newChallenger) {
        if (winnerPosition === "left") {
          setCurrentPair([updatedWinner, newChallenger]);
        } else {
          setCurrentPair([newChallenger, updatedWinner]);
        }
      }
    }
  };

  const handleVote = async (winner: LeaderboardCompany) => {
    if (isVoting || !currentPair) {
      return;
    }

    setIsVoting(true);
    setVotes(prev => prev + 1);

    const [leftCompany, rightCompany] = currentPair;
    const loser = winner.id === leftCompany.id ? rightCompany : leftCompany;

    const matchupKey = createMatchupKey(winner, loser);
    setCompletedMatchups(prev => new Set([...prev, matchupKey]));

    const { winnerNewRating, loserNewRating } = calculateEloChange(winner.elo, loser.elo);
    const optimisticCompanies = companyPool.map(company => {
      if (company.id === winner.id) {
        return { ...company, elo: winnerNewRating };
      }
      if (company.id === loser.id) {
        return { ...company, elo: loserNewRating };
      }
      return company;
    });

    queryClient.setQueryData(["leaderboard"], optimisticCompanies);

    const winnerWasLeft = winner.id === leftCompany.id;
    const lockedPosition = winnerWasLeft ? "left" : "right";

    if (winnerPosition === null) {
      setWinnerPosition(lockedPosition);
    } else if (winnerPosition !== lockedPosition) {
      setWinnerPosition(lockedPosition);
    }

    const updatedWinner = optimisticCompanies.find(company => company.id === winner.id);
    const newCompletedMatchups = new Set([...completedMatchups, matchupKey]);
    const newChallenger = updatedWinner
      ? getNextChallenger(optimisticCompanies, [winner.id], updatedWinner, newCompletedMatchups)
      : null;

    if (updatedWinner && newChallenger) {
      if (lockedPosition === "left") {
        setCurrentPair([updatedWinner, newChallenger]);
      } else {
        setCurrentPair([newChallenger, updatedWinner]);
      }
    }

    try {
      const result = winner.id === leftCompany.id ? "a" : "b";
      const updatedRows = await recordMatchup({
        companyA: leftCompany.id,
        companyB: rightCompany.id,
        result,
        submittedBy: user?.id ?? null,
      });

      if (Array.isArray(updatedRows) && updatedRows.length > 0) {
        queryClient.setQueryData<LeaderboardCompany[]>(["leaderboard"], previous => {
          if (!previous) {
            return previous;
          }
          const updateMap = new Map(
            updatedRows.map(row => [row.company_id, row])
          );
          return previous.map(company => {
            const update = updateMap.get(company.id);
            if (!update) {
              return company;
            }
            return {
              ...company,
              elo: Math.round(Number(update.rating)),
              matchesPlayed: update.matches_played,
              wins: update.wins,
              losses: update.losses,
              draws: update.draws,
              rank: update.rank,
            };
          });
        });
      }
    } catch (error) {
      console.error("Failed to record matchup", error);
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setIsVoting(false);
    }
  };

  if (isLoading || !currentPair) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const [leftCompany, rightCompany] = currentPair;
  const leftLogo = leftCompany.logoUrl ?? defaultLogo;
  const rightLogo = rightCompany.logoUrl ?? defaultLogo;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Which SWE internship would you prefer?
          </h1>
          <p className="text-muted-foreground mb-4">
            Help build the ultimate internship ranking using ELO rating system
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Trophy size={16} />
            <span>{votes} votes cast</span>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                isVoting ? "pointer-events-none opacity-70" : ""
              }`}
              onClick={() => handleVote(leftCompany)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <img
                    src={leftLogo}
                    alt={leftCompany.name}
                    className="h-12 md:h-16 mx-auto object-contain"
                  />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-foreground mb-2">
                  {leftCompany.name}
                </h3>
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{leftCompany.elo}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      {leftCompany.averageReviewScore
                        ? leftCompany.averageReviewScore.toFixed(1)
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <PayStats pay={leftCompany.payDisplay} />
              </CardContent>
            </Card>

            <div className="flex flex-col items-center justify-center space-y-4">
              <span className="text-sm text-muted-foreground">or</span>
              <Button
                variant="outline"
                onClick={handleDontKnow}
                disabled={isVoting}
              >
                I&apos;m not sure
              </Button>
            </div>

            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                isVoting ? "pointer-events-none opacity-70" : ""
              }`}
              onClick={() => handleVote(rightCompany)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <img
                    src={rightLogo}
                    alt={rightCompany.name}
                    className="h-12 md:h-16 mx-auto object-contain"
                  />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-foreground mb-2">
                  {rightCompany.name}
                </h3>
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{rightCompany.elo}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      {rightCompany.averageReviewScore
                        ? rightCompany.averageReviewScore.toFixed(1)
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <PayStats pay={rightCompany.payDisplay} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vote;
