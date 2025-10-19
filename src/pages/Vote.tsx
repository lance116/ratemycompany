import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Linkedin, Trophy, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchVoteMatchup,
  recordMatchup,
  VoteMatchupCompany,
  VoteMatchupPayload,
} from "@/data/companies";

type Selection = VoteMatchupCompany["id"] | "draw" | null;

type StatsDelta = {
  elo: number;
  rank: number;
};

const Vote = () => {
  const [selection, setSelection] = useState<Selection>(null);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [companies, setCompanies] = useState<[VoteMatchupCompany, VoteMatchupCompany] | null>(null);
  const [statDeltas, setStatDeltas] = useState<Record<string, StatsDelta>>({});
  const [statTriggers, setStatTriggers] = useState<Record<string, number>>({});
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [voteLocked, setVoteLocked] = useState(false);
  const resetTimerRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<VoteMatchupPayload>({
    queryKey: ["vote-matchup"],
    queryFn: fetchVoteMatchup,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (data) {
      setCompanies(data.companies);
      setVoteCount(typeof data.totalVotes === "number" ? data.totalVotes : 0);
      setSelection(null);
      setStatDeltas({});
      setStatTriggers({});
      setMutationError(null);
      setVoteLocked(false);
    }
  }, [data]);

  useEffect(
    () => () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    []
  );

  const voteMutation = useMutation({
    mutationFn: recordMatchup,
    onSuccess: (rows) => {
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      rows.forEach((row) => {
        queryClient.invalidateQueries({ queryKey: ["company", row.company_id] });
        queryClient.invalidateQueries({ queryKey: ["companyEloHistory", row.company_id] });
        queryClient.invalidateQueries({ queryKey: ["companyReviews", row.company_id] });
      });

      if (!companies) {
      return;
      }

      const updates = new Map(
        rows.map((row) => [
          row.company_id,
          {
            elo: Math.round(Number(row.rating ?? 0)),
            rank: row.rank ?? null,
          },
        ])
      );

      const updatedDeltas: Record<string, StatsDelta> = {};

      setCompanies((prev) => {
        if (!prev) {
          return prev;
        }

        const next = prev.map((company) => {
          const update = updates.get(company.id);
          if (!update) {
            return company;
          }

          const eloDelta = update.elo - company.elo;
          let nextRank = company.rank;
          let rankDelta = 0;

          if (eloDelta !== 0) {
            const updatedRank =
              typeof update.rank === "number" && update.rank > 0 ? update.rank : company.rank;
            nextRank = updatedRank;
            rankDelta = company.rank - updatedRank;
          }

          updatedDeltas[company.id] = {
            elo: eloDelta,
            rank: rankDelta,
          };

          return {
            ...company,
            elo: update.elo,
            rank: nextRank,
          };
        }) as [VoteMatchupCompany, VoteMatchupCompany];

        return next;
      });

      setStatDeltas(updatedDeltas);
      setVoteCount((prev) => prev + 1);

      const now = Date.now();
      setStatTriggers((prev) => {
        const next = { ...prev };
        rows.forEach((row) => {
          next[row.company_id] = now;
        });
        return next;
      });

      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = window.setTimeout(() => {
        refetch();
      }, 900);
    },
    onError: (err: Error) => {
      setMutationError(err.message);
      setVoteLocked(false);
    },
  });

  if (isLoading && !companies) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900">
        Loading live matchup...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-slate-900">
        <p className="text-lg font-semibold">Something went wrong loading the matchup.</p>
        <p className="mt-2 text-sm text-slate-500">{error.message}</p>
        <Button className="mt-6" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!companies) {
    return null;
  }

  const [leftCompany, rightCompany] = companies;

  const handleCompanySelect = (companyId: string) => {
    if (!companies || voteMutation.isPending || voteLocked) {
      return;
    }

    setSelection(companyId);
    setVoteLocked(true);
    const now = Date.now();
    setStatTriggers((prev) => ({
      ...prev,
      [leftCompany.id]: now,
      [rightCompany.id]: now,
    }));

    const result: "a" | "b" = companyId === leftCompany.id ? "a" : "b";

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    voteMutation.mutate({
        companyA: leftCompany.id,
        companyB: rightCompany.id,
      result,
    });
  };

  const handleDraw = () => {
    if (!companies || voteMutation.isPending || voteLocked) {
      return;
    }

    setSelection("draw");
    setVoteLocked(true);
    const now = Date.now();
    setStatTriggers((prev) => ({
      ...prev,
      [leftCompany.id]: now,
      [rightCompany.id]: now,
    }));

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    voteMutation.mutate({
      companyA: leftCompany.id,
      companyB: rightCompany.id,
      result: "draw",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-950">
      <BackgroundCanvas />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 sm:py-12 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 px-6 py-7 text-center shadow-[0_28px_60px_-38px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:px-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-500">
            Live Head-to-Head
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl md:text-[2.15rem]">
            Which company would you rather work at?
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Cast your vote and watch the Elo rankings update live. Upsets make the leaderboard swing!
          </p>
          <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-amber-400/50 bg-amber-100/70 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.4em] text-amber-600">
            <Trophy className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
            <span className="tabular-nums text-slate-800">
              {voteCount.toLocaleString()} total votes recorded
            </span>
          </div>
          {mutationError && (
            <p className="mt-4 text-xs font-semibold text-rose-500">{mutationError}</p>
          )}
        </section>

        <section className="mt-6 flex flex-1 flex-col justify-center">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)] backdrop-blur sm:p-6">
            <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4">
              <CompanyCard
                company={leftCompany}
                isWinner={selection === leftCompany.id}
                isLoser={
                  selection !== null && selection !== "draw" && selection !== leftCompany.id
                }
                statDelta={statDeltas[leftCompany.id]}
                statTrigger={statTriggers[leftCompany.id]}
                disabled={voteMutation.isPending || voteLocked}
                onSelect={() => handleCompanySelect(leftCompany.id)}
              />

              <CompanyCard
                company={rightCompany}
                isWinner={selection === rightCompany.id}
                isLoser={
                  selection !== null && selection !== "draw" && selection !== rightCompany.id
                }
                statDelta={statDeltas[rightCompany.id]}
                statTrigger={statTriggers[rightCompany.id]}
                disabled={voteMutation.isPending || voteLocked}
                onSelect={() => handleCompanySelect(rightCompany.id)}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-center">
            <Button
              type="button"
              onClick={handleDraw}
              disabled={voteMutation.isPending || voteLocked}
              className={cn(
                "w-full max-w-xs rounded-2xl border border-amber-400/70 bg-amber-400 px-6 py-3 text-[0.8rem] font-semibold uppercase tracking-[0.42em] text-slate-900 shadow-[0_18px_40px_-28px_rgba(217,119,6,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80",
                "disabled:pointer-events-none disabled:bg-amber-400 disabled:text-slate-900 disabled:opacity-100 disabled:shadow-[0_12px_28px_-24px_rgba(217,119,6,0.65)]",
                selection === "draw" && "ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white"
              )}
            >
              Draw/Tie
            </Button>
          </div>
        </section>
      </div>

      {isFetching && (
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/30 via-white/10 to-transparent" />
      )}

      <footer className="relative z-10 border-t border-slate-200/80 bg-white/85 w-full">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10 text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          {/* Mobile branding */}
          <div className="sm:hidden flex items-center gap-2 mb-4 w-full">
            <img src="/ratemycompany logo.png" alt="ratemycompany" className="h-8 w-8 object-contain flex-shrink-0" />
            <span className="font-bold text-foreground">ratemycompany.ca</span>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-800">
              &copy; {new Date().getFullYear()} ratemycompany. All rights reserved.
            </p>
            <p className="text-sm">
              If you want your company featured, feel free to contact me:
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
            >
              <a href="https://www.linkedin.com/in/lance-yan/" target="_blank" rel="noreferrer">
                <Linkedin className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
            >
              <a href="https://github.com/lance116" target="_blank" rel="noreferrer">
                <Github className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
            >
              <a href="https://x.com/cnnguan" target="_blank" rel="noreferrer">
                <Twitter className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">X (Twitter)</span>
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

type CardProps = {
  company: VoteMatchupCompany;
  isWinner: boolean;
  isLoser: boolean;
  statDelta?: StatsDelta;
  statTrigger?: number;
  disabled?: boolean;
  onSelect: () => void;
};

const CompanyCard = ({
  company,
  isWinner,
  isLoser,
  statDelta,
  statTrigger,
  disabled,
  onSelect,
}: CardProps) => {
  const logoSrc = company.logoUrl ?? "/placeholder.svg";
  const [wasTouched, setWasTouched] = useState(false);

  const handleClick = () => {
    setWasTouched(true);
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
      "vote-card relative flex min-h-[20rem] flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-200/85 bg-gradient-to-br from-white via-slate-50/80 to-white px-5 py-6 text-left transition-all duration-300 ease-out sm:px-6 sm:py-7",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
      "disabled:cursor-not-allowed disabled:opacity-80",
      !isWinner &&
        !isLoser &&
        !wasTouched &&
        "hover:-translate-y-0.5 hover:border-amber-300/70 hover:bg-white hover:brightness-105 hover:saturate-110 hover:shadow-[0_36px_72px_-40px_rgba(217,119,6,0.35)]",
        isWinner &&
          "winner-glow border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-white to-amber-100/60 shadow-[0_36px_72px_-40px_rgba(217,119,6,0.35)] brightness-110 saturate-110",
        isLoser && "loser-sink border-slate-200/60 opacity-70 brightness-90 saturate-75"
      )}
    >
      <div className={cn(
        "pointer-events-none absolute inset-0",
        isWinner && "bg-[radial-gradient(circle_at_top,rgba(252,211,77,0.35),transparent_70%)]"
      )} />
      <div className="relative z-10 flex h-full flex-col justify-between gap-0">
        <div className="flex flex-col gap-1">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white px-6 py-12 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
            <img
              src={logoSrc}
              alt={`${company.name} logo`}
              className="mx-auto h-20 w-full object-contain"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl min-h-20 flex items-center justify-center">
              {company.name}
            </h2>

            <div className="min-h-12 flex items-center justify-center">
              <div className="flex flex-wrap items-baseline gap-2">
                <AnimatedStat
                  label="Elo"
                  value={company.elo}
                  delta={statDelta?.elo}
                  trigger={statTrigger}
                />
                <AnimatedStat
                  label="Rank"
                  value={company.rank}
                  delta={statDelta?.rank}
                  trigger={statTrigger}
                />
              </div>
            </div>
          </div>
        </div>

        {company.tags.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-2 min-h-8 mt-auto justify-center">
            {company.tags.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-600"
              >
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
};

type AnimatedStatProps = {
  label: string;
  value: number;
  delta?: number;
  trigger?: number;
};

const AnimatedStat = ({ label, value, delta, trigger }: AnimatedStatProps) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"rise" | "fall" | "steady">("steady");
  const intervalRef = useRef<number | null>(null);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (trigger === undefined) {
      setDisplayValue(value);
      prevValueRef.current = value;
      setDirection("steady");
      return;
    }

    const previous = prevValueRef.current;
    if (previous === value) {
      setDisplayValue(value);
      prevValueRef.current = value;
      setDirection("steady");
      return;
    }

    const diff = value - previous;
    if (diff < 0) {
      setDirection("rise");
    } else if (diff > 0) {
      setDirection("fall");
    } else {
      setDirection("steady");
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    setIsAnimating(true);
    let current = previous;
    const step = diff > 0 ? 1 : -1;
    const steps = Math.max(1, Math.abs(Math.round(diff)));
    const intervalDuration = Math.max(24, Math.min(75, 260 / steps));

    intervalRef.current = window.setInterval(() => {
      if (current === value) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsAnimating(false);
        prevValueRef.current = value;
        return;
      }

      current += step;
      if ((step > 0 && current > value) || (step < 0 && current < value)) {
        current = value;
      }
      setDisplayValue(current);
    }, intervalDuration);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [value, trigger]);

  useEffect(() => {
    if (trigger === undefined) {
      return;
    }
    const timeout = window.setTimeout(() => setIsAnimating(false), 950);
    return () => window.clearTimeout(timeout);
  }, [trigger]);

  const deltaRounded =
    delta !== undefined && !Number.isNaN(delta) ? Math.round(delta) : undefined;
  const showDelta = trigger !== undefined && deltaRounded !== undefined;
  const deltaClass =
    deltaRounded !== undefined && deltaRounded > 0
      ? "text-emerald-500"
      : deltaRounded !== undefined && deltaRounded < 0
      ? "text-rose-500"
      : "text-slate-400";

  return (
    <div
      className={cn(
        "vote-stat flex items-baseline gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.6)] backdrop-blur-sm transition-transform",
        isAnimating && "vote-stat--pulse",
        direction === "rise" && "vote-stat--rise",
        direction === "fall" && "vote-stat--fall"
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-slate-500">
        {label}:
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-semibold text-slate-900 tabular-nums">{displayValue}</span>
        {showDelta && (
          <span className={cn("text-[0.75rem] font-semibold tabular-nums", deltaClass)}>
            {deltaRounded !== undefined
              ? deltaRounded > 0
                ? `+${deltaRounded}`
                : deltaRounded < 0
                ? deltaRounded
                : "+0"
              : null}
          </span>
        )}
      </div>
    </div>
  );
};

const BackgroundCanvas = () => (
  <div aria-hidden className="pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,224,71,0.32),transparent_62%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(253,186,116,0.18),transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.12),transparent_72%)] blur-3xl" />
    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-200 via-amber-100/30 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-amber-100 via-transparent to-transparent" />
  </div>
);

export default Vote;
