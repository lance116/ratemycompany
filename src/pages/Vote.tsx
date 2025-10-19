import { useEffect, useMemo, useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Hash, Sparkles, Trophy } from "lucide-react";
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
  const [completedMatchups, setCompletedMatchups] = useState<Set<string>>(new Set());
  const [displayedRatings, setDisplayedRatings] = useState<Record<string, number>>({});
  const [eloDiffs, setEloDiffs] = useState<Record<string, number>>({});
  const animationRef = useRef<number | null>(null);
  const interactionGateRef = useRef<{ animationDone: boolean; rpcDone: boolean }>({
    animationDone: false,
    rpcDone: false,
  });
  const [winnerHighlight, setWinnerHighlight] = useState<string | null>(null);

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

  useEffect(() => {
    if (!currentPair) {
      return;
    }
    const [left, right] = currentPair;
    setDisplayedRatings({
      [left.id]: left.elo,
      [right.id]: right.elo,
    });
    setEloDiffs({});
  }, [currentPair]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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

  const animateEloChange = ({
    winnerId,
    loserId,
    startWinner,
    startLoser,
    targetWinner,
    targetLoser,
    onComplete,
  }: {
    winnerId: string;
    loserId: string;
    startWinner: number;
    startLoser: number;
    targetWinner: number;
    targetLoser: number;
    onComplete: () => void;
  }) => {
    const duration = 900;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplayedRatings(prev => ({
        ...prev,
        [winnerId]: Math.round(startWinner + (targetWinner - startWinner) * progress),
        [loserId]: Math.round(startLoser + (targetLoser - startLoser) * progress),
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        animationRef.current = null;
        onComplete();
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(step);
  };

  const handleDontKnow = () => {
    if (!currentPair) {
      return;
    }

    const newPair = getRandomPair(companyPool, [], completedMatchups);
    setEloDiffs({});
    setWinnerHighlight(null);
    setCurrentPair(newPair);
  };

  const handleVote = async (winner: LeaderboardCompany) => {
    if (isVoting || !currentPair) {
      return;
    }

    setIsVoting(true);
    setVotes(prev => prev + 1);
    interactionGateRef.current = { animationDone: false, rpcDone: false };
    setWinnerHighlight(winner.id);

    const releaseGate = () => {
      const gate = interactionGateRef.current;
      if (gate.animationDone && gate.rpcDone) {
        setIsVoting(false);
      }
    };

    const [leftCompany, rightCompany] = currentPair;
    const loser = winner.id === leftCompany.id ? rightCompany : leftCompany;

    const matchupKey = createMatchupKey(winner, loser);
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

    const startWinnerRating = displayedRatings[winner.id] ?? winner.elo;
    const startLoserRating = displayedRatings[loser.id] ?? loser.elo;

    setEloDiffs({
      [winner.id]: Math.round(winnerNewRating - startWinnerRating),
      [loser.id]: Math.round(loserNewRating - startLoserRating),
    });

    const newCompletedMatchups = new Set([...completedMatchups, matchupKey]);
    setCompletedMatchups(newCompletedMatchups);

    const nextPair = getRandomPair(optimisticCompanies, [], newCompletedMatchups);

    animateEloChange({
      winnerId: winner.id,
      loserId: loser.id,
      startWinner: startWinnerRating,
      startLoser: startLoserRating,
      targetWinner: winnerNewRating,
      targetLoser: loserNewRating,
      onComplete: () => {
        interactionGateRef.current = {
          ...interactionGateRef.current,
          animationDone: true,
        };
        releaseGate();
        setTimeout(() => {
          setEloDiffs({});
          setCurrentPair(nextPair);
          setWinnerHighlight(null);
        }, 80);
      },
    });

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
      interactionGateRef.current = {
        ...interactionGateRef.current,
        rpcDone: true,
      };
      releaseGate();
    }
  };

  if (isLoading || !currentPair) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const [leftCompany, rightCompany] = currentPair;

  const renderCompanyCard = (company: LeaderboardCompany) => {
    const logo = company.logoUrl ?? defaultLogo;
    const currentRating = displayedRatings[company.id] ?? company.elo;
    const ratingDiff = eloDiffs[company.id] ?? 0;
    return (
      <Card
        key={company.id}
        className={cn(
          "group relative w-full cursor-pointer overflow-hidden border border-border bg-card text-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-foreground/30 hover:shadow-lg",
          winnerHighlight === company.id && "md:-translate-y-3 border-primary shadow-lg"
        )}
        onClick={() => handleVote(company)}
      >
        <CardContent className="relative flex flex-col items-center gap-4 p-6 text-center">
          <div className="relative w-full">
            <div
              className={cn(
                "mx-auto flex h-36 w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl bg-secondary shadow-inner transition duration-300",
                winnerHighlight === company.id ? "bg-secondary/60" : "group-hover:bg-secondary/80"
              )}
            >
              <img
                src={logo}
                alt={company.name}
                className="h-28 w-28 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
          <h3 className="text-xl font-bold tracking-tight md:text-2xl">
            {company.name}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 shadow-inner transition group-hover:bg-secondary/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Trophy className="h-4 w-4" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs uppercase tracking-[0.25em]">Elo</span>
                <span className="text-base font-semibold">
                  {currentRating}
                </span>
                {ratingDiff !== 0 && (
                  <span
                    className={cn(
                      "text-xs font-semibold transition-colors duration-500",
                      ratingDiff > 0 ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {ratingDiff > 0 ? "+" : ""}
                    {ratingDiff}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 shadow-inner transition group-hover:bg-secondary/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Hash className="h-4 w-4" />
              </div>
              <span className="text-xs uppercase tracking-[0.25em]">Rank</span>
              <span className="text-base font-semibold">
                #{company.rank}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.25em] text-muted-foreground/80">
            {company.tags.slice(0, 4).map(tag => (
              <span key={tag} className="rounded-full border border-border bg-secondary px-2 py-1 uppercase">
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
          <div className="mt-4 w-full">
            <PayStats pay={company.payDisplay} className="justify-center text-sm" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 md:py-12 space-y-10">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-xs uppercase tracking-[0.35em]">
            Live Head-to-Head
          </Badge>
          <h1 className="text-3xl font-bold md:text-4xl">
            Which SWE internship would you prefer?
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground/90">
            Cast your vote and watch the Elo rankings update live. Upsets make the leaderboard swing!
          </p>
          <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Trophy size={16} />
            <span className="tabular-nums">{votes} votes recorded</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center space-y-8">
          <div className="flex w-full flex-1 flex-col gap-6 md:flex-row md:items-stretch md:justify-between">
            {renderCompanyCard(leftCompany)}

            <div className="flex h-full items-center justify-center">
              <div className="rounded-full border border-border bg-card px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground shadow-sm">
                VS
              </div>
            </div>

            {renderCompanyCard(rightCompany)}
          </div>

          <Button
            variant="default"
            size="lg"
            className="w-full max-w-sm gap-3 rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90"
            onClick={handleDontKnow}
            disabled={isVoting}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-base font-semibold uppercase tracking-[0.25em]">I&apos;m not sure</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Vote;
